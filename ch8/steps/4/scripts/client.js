/**
 * @fileoverview perfuse JavaScript.
 *
 * Initializes UI, starts and stops distributed performance tests,
 * and shows real-time results of running performance tests.
 */

function MyCntrl($scope) {
    $scope.tests = [
        {
            name:'random', 
            cmd:'random', 
            interval: '3',
            regexp: '',
            label: '',
        },
        {
            name:'randread', 
            cmd:'fio --name=foo --rw=randread --size=10m --blocksize=4k --iodepth=64 --direct=1', 
            interval: '4',
            regexp: '  read :.* iops=(.*) ,',
            label: 'IOPs',
        },
        {
            name:'randwrite', 
            cmd:'fio --name=foo --rw=randwrite --size=10m --blocksize=4k --iodepth=64 --direct=1', 
            interval: '3',
            regexp: 'write:.* iops=(.*) ,',
            label: 'IOPs',
        },
        {
            name:'seqread', 
            cmd:'fio --name=foo --rw=read --size=300m --blocksize=1m --iodepth=16 --direct=1', 
            interval: '9',
            regexp: ' READ:.* aggrb=(.*)KB\/s, minb=',
            label: 'KB/s',
        },
        {
            name:'network', 
            cmd:'iperf -c localhost -t 2 -f m', 
            interval: '3',
            regexp: '\\s+([\\d\\.]+)\\s+Mbits\\/s',
            label: 'MBits/s',
        },
    ];
    $scope.test = $scope.tests[0];

    $scope.start_test = function () {
        var name = $scope.test.name;
        var cmd = $scope.test.cmd;
        var interval = $scope.test.interval;
        var regexp = $scope.test.regexp;
        var label = $scope.test.label;
        perfuse.perfToggle(name, cmd, interval, regexp, label);
    };
}

/**
 * Perfuse class.
 * @constructor
 */
var Perfuse = function() {
    this.wsPort = '8080';
    this.ipAddr = location.host.split(':')[0];
    this.perfState = false;
    this.webSock = null;
    this.repeatingTests = null;
    this.reqCount = 0;
    this.data = [];
    this.active = {};
    this.resetBars = false;
};

Perfuse.prototype.perfToggle = function (type, cmd, interval, regexp, label) {
    var id = 'perf-graph';
    if (this.perfState) {
        clearInterval(this.repeatingTests);
        //del_bar_chart();
        document.getElementById(id).style.display = 'none';
        this.perfState = false;
        this.webSock.close();
        this.reqCount = 0;
        document.getElementById('start-test-button').innerHTML = 'Start Test';
    } else { 
        document.getElementById(id).style.display = 'block';
        this.data = [];
        this.resetBars = true;
        //gen_bar_chart(label);
        this.perfState = true;
        if (('WebSocket' in window) && this.ipAddr) {
            var url = 'ws://' + this.ipAddr + ':' + this.wsPort + '/';
            this.webSock = new WebSocket(url);
            this.webSock.onmessage = function(event) {
                var res = JSON.parse(event.data);
                if (res.type == 'perf') {
                    var host_num = res.host - 1;
                    var index = null;
                    var new_val = parseInt(res.host, 10);
 
                    if (res.host in this.active) {
                        index = this.active[res.host];
                    } else {
                        index = 0;
                        for (i in this.data) {
                            var old_val = parseInt(this.data[i].host, 10);
                            if (old_val > new_val) {
                                break;
                            }
                            index++;
                        }
                        this.data.splice(index, 0, {});
                        this.resetBars = true;
                    }
                    this.data[index] = { 
                                      host: res.host, 
                                      value: parseFloat(res.value, 10) 
                                  };
                    for (i in this.data) {
                        this.active[this.data[i].host] = i;
                    }
                    if (this.reqCount >= 0) {
                        //redraw_bars(this.data, this.resetBars, this.reqCount);
                        this.resetBars = false;
                    }
                }
            }.bind(this);

            this.webSock.onopen = function() {
                var req = {};
                req.type = type;
                req.cmd = cmd;
                req.regexp = regexp;
                var req_str = JSON.stringify(req);
                this.webSock.send(req_str);
                this.repeatingTests = setInterval(function() {
                    this.reqCount++;
                    this.webSock.send(req_str);
                }.bind(this), interval * 1000);
            }.bind(this);
        }
        document.getElementById('start-test-button').innerHTML = 'Stop Test';
    }
};

