var NanoTimer = require('../lib/nanoTimer.js');
var should = require('should');

var timerA = new NanoTimer('log');


describe('nanoTimer', function(){
    //######## time function #########
    describe('.time', function(){
        
        //Test 1 - Synchronous Task Timing
        it('#1: synchronous, count to 1 million, 1000 samples', function(){
            
            var times = [];
            var i = 0;
            var numSamples = 1000;
            
            //Simple count to 1 million task
            var syncTask = function(){
                var count = 0;
                var i = 0;
                for(i=0;i<1000000;i++){
                    count++;
                };
            };
            
            //Test numSamples # of times
            for(i=0;i<numSamples;i++){
                times.push(timerA.time(syncTask, [], 'm'));
            }
            
            //Assertions
            times.length.should.eql(1000);
            
            var avg = 0;
            var max = 0;
            var min = 1000000000000000000;
            for(i=0;i<numSamples;i++){
                avg+=times[i];
                if(times[i] > max){
                    max = times[i];
                }
                
                if(times[i] < min){
                    min = times[i];
                }
            }
            
            avg = avg/numSamples;
            console.log('\n\t\t - Average time: ' + avg + ' milliseconds');
            console.log('\t\t - Max time: ' + max + ' milliseconds');
            console.log('\t\t - Min time: ' + min + ' milliseconds');
            
        });
        
        //Test 2 - Asynchronous Task Timing
        it('#2: asynchronous, count to 1 million, 1000 samples', function(done){
            
            var i = 0;
            var j = 0;
            var numSamples = 1000;
            var doneCount = 0;
            var times = [];
            
            //Count to 1000 asynchronously
            var asyncTask = function(callback){
                
                if(i < 1000000){
                    setImmediate(function(){asyncTask(callback);});
                } else {
                    callback();
                }
                
                i++;
            };
            
            //Run 10 instances of async task.
            for(j=0;j<numSamples;j++){
                timerA.time(asyncTask, [], 's', function(runtime){
                    should.exist(runtime);
                    times.push(runtime);
                    doneCount++;
                    if(doneCount == numSamples){
                        var avg = 0;
                        var max = 0;
                        var min = 1000000000000000000;
                        for(i=0;i<1000;i++){
                            avg+=times[i];
                            if(times[i] > max){
                                max = times[i];
                            }
                
                            if(times[i] < min){
                                min = times[i];
                            }
                        }
            
                        avg = avg/numSamples;
                        console.log('\n\t\t - Average time: ' + avg + ' seconds');
                        console.log('\t\t - Max time: ' + max + ' seconds');
                        console.log('\t\t - Min time: ' + min + ' seconds');
                        done(); 
                    }
                });
            } 
        });
    });
    
    
    //######## timeout function ########
    describe('.setTimeout', function(){
        //Test 3 - sync task
        it('#3: sync, wait 0.1 seconds, 20 samples\n\n', function(done){
            var i = 0;
            var j = 0;
            var numSamples = 20;
            var doneCount = 0;
            var errors = [];
            var minError = 1000000000;
            var maxError = 0;
            var avgError = 0;
            
            
            var task = function(){
                var count = 0;
                for(i=0;i<1000000;i++){
                    count++;
                }; 
            };
            
            for(j=0;j<numSamples;j++){
                
                timerA.setTimeout(task, [], '0.1s', function(data){
                    var waitTime = data.waitTime;
                    console.log('\t\t - Sample #' + (doneCount+1));
                    console.log('\t\t\t - Expected wait: 0.1 seconds');
                    console.log('\t\t\t - Actual wait: ' + waitTime/1000000000 + ' seconds');
                    var error = (((waitTime - 100000000) / (100000000)) * 100);
                    console.log('\t\t\t - Error: ' + error + '%');
                    errors.push(error);
                    var waitedLongEnough = (waitTime >= 100000000);
                    waitedLongEnough.should.be.true;
                    
                    doneCount++;
                    
                    if(doneCount == numSamples){
                        for(i=0;i<numSamples;i++){
                            if(errors[i] < minError){
                                minError = errors[i];
                            }
                            
                            if (errors[i] > maxError){
                                maxError = errors[i];
                            }
                            
                            avgError += errors[i];
                        }
                        avgError = avgError / numSamples;
                        console.log('\t\t - Min. Error: ' + minError + '%');
                        console.log('\t\t - Max. Error: ' + maxError + '%');
                        console.log('\t\t - Avg. Error: ' + avgError + '%');
                        done();
                    }
                });
            }
            
            
            
        });
        
        //Test 4 - async task
        it('#4: setTimeout on async function with callback\n\n', function(done){
            var asyncTask = function(callback, i){
                if(!i){
                    var i = 0;
                }
                
                if(i < 1000){
                    setImmediate(function(){
                        i++;
                        asyncTask(callback, i);
                    });
                } else {
                    callback('got data');
                }
            };
            
            var runAsync = function(){
                var msg = '';
                asyncTask(function(data){
                    msg = data;
                    msg.should.eql('got data');
                });  
            };
            
            timerA.setTimeout(runAsync, [], '1s', function(data) {
                var waitTime = data.waitTime;
                console.log('\t\t - Expected wait: 1 seconds');
                console.log('\t\t - Actual wait: ' + waitTime/1000000000 + ' seconds');
                console.log('\t\t - Error: ' + (((waitTime - 1000000000) / (1000000000)) * 100) + '%');
                var waitedLongEnough = (waitTime >= 1000000000);
                waitedLongEnough.should.be.true;
                done();
            });
            
        });
        
        
        it('#5 works with functions with args passed in\n\n', function(done){
            var someObject = {};
            someObject.number = 10;
        
        
            var taskWithArgs = function(object){
                object.number = 5;
            };
            
            timerA.setTimeout(taskWithArgs, [someObject], '1s', function(data){
                var waitTime = data.waitTime;
                console.log('\t\t - Expected wait: 1 seconds');
                console.log('\t\t - Actual wait: ' + waitTime/1000000000 + ' seconds');
                console.log('\t\t - Error: ' + (((waitTime - 1000000000) / (1000000000)) * 100) + '%');
                var waitedLongEnough = (waitTime >= 1000000000);
                waitedLongEnough.should.be.true;
                someObject.number.should.eql(5);
                done();
            
            });
            
            
        });
        
    });
    
    //######## setInterval function ########
    describe('setInterval && clearInterval', function(){
        it('#6 successfully works\n\n', function(done){
        
            var task = function(){
                console.log('\t\t - task was run!');
            };
            
            
            timerA.setInterval(task, [], '0.1s', function(){
                done();
            });
            
            timerA.setTimeout(function(){
                console.log('\t\t - clearing interval');
                timerA.clearInterval();
            }, [], '5s');

        });
        
    });
    
});




