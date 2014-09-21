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
        Perfuse.perfToggle(name, cmd, interval, regexp, label);
    };
}

/**
 * Perfuse class.
 * @constructor
 */
var Perfuse = function() { };
