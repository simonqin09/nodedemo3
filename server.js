/**
 Node.js GPIO. Handles GPIO configuration and access.
 
 This app is a demo example of how to use Node.js to access 
 and control the Toradex Colibri VF61 GPIO.
 */

/* Modules */
var fs = require('fs'); //module to handle the file system
var debug = require('debug')('myserver'); //debug module
var express = require('express'); //webserver module
var bodyParser = require('body-parser'); //parse JSON encoded strings
var app = express();

/* VF61 GPIO pins */
/*const	SW5 = '63', // PTD31, 106(SODIMM)
	SW6 = '89', // PTD10, 135(SODIMM)
        LED1 = '88', // PTD9, 133(SODIMM)
	LED2 = '68'; // PTD26, 127(SODIMM)*/
const GPIO = {	LED1:'88',	LED2:'68',
				SW1:'63',	SW2:'89'};
	
/* Constants */
const HIGH = 1, LOW = 0, IP_ADDR = '10.20.1.108', PORT_ADDR = 3000;

//starting app
debug('Starting VF61 GPIO control'); //Hello message

//Using Express to create a server
app.use(express.static(__dirname)); //add the directory where HTML and CSS files are
var server = app.listen(PORT_ADDR, IP_ADDR, function () {//listen at the port and address defined
    var host = server.address().address;
    var port = server.address().port;
    var family = server.address().family;
    debug('Express server listening at http://%s:%s %s', host, port, family);
});

app.use(bodyParser.urlencoded({ //to support URL-encoded bodies, must come before routing
	extended: true
}));

app.route('/gpio') //used to unite all the requst types for the same route
.post(function (req, res) { //handles incoming POST requests
    var serverResponse = {};
    serverResponse['gpio'] = {};
    var btn = req.body.id, val = req.body.val; // get the button id and value
    if(btn == "getGPIO"){ //if client requests GPIO status
    	serverResponse['status'] = 'readgpio';
    	for(io in GPIO){ //iterate through all GPIO
    		serverResponse.gpio[io] = +rdGPIO(GPIO[io]); //and get its current status as a string
    	}
    }
    else{ //otherwise change GPIO status
    	serverResponse.status = 'changegpio'; //echo which button was pressed
        if(val == 1){ //if button is clicked, turn on the leds
        	serverResponse.gpio[btn] = HIGH;
        	wrGPIO(GPIO[btn], HIGH);
        }
        else{ //if button is unclicked, turn off the leds
        	serverResponse.gpio[btn] = LOW;
        	wrGPIO(GPIO[btn], LOW);
        }
    }
    res.send(serverResponse); //echo the changes made to GPIO
});

setImmediate(function cfgOurPins(){
	for(io in GPIO){ //for every GPIO pin
		if(io.indexOf('LED') != -1){ //if it is a LED
			cfGPIO(GPIO[io], 'out'); //configure it as output
		}
		else if(io.indexOf('SW') != -1){ //make sure it is a switch
			cfGPIO(GPIO[io], 'in'); //configure it as input
		}
	}
});

function cfGPIO(pin, direction){
/*---------- export pin if not exported and configure the pin direction -----------*/
        fs.access('/sys/class/gpio/gpio' + pin, fs.F_OK, function(err){//test if current GPIO file exist
                if(err){ //if GPIO isn't exported, do it
                        debug('exporting GPIO' + pin);
                        fs.writeFileSync('/sys/class/gpio/export', pin);//export pin
                }
                debug('Configuring GPIO' + pin + ' as ' + direction);
                fs.writeFileSync('/sys/class/gpio/gpio' + pin + '/direction', direction);
        });
}

function rdGPIO(pin){
/*---------- read GPIO value and return it -----------*/
	return fs.readFileSync('/sys/class/gpio/gpio' + pin + '/value');
}

function wrGPIO(pin, value){
/*---------- write value to corresponding GPIO -----------*/
	fs.writeFileSync('/sys/class/gpio/gpio' + pin + '/value', value);
}

function copySwToLed(){
/********* Copy the sw values into the LEDs  *********/
        var state_now; //temporary sw value
        
        debug('Polling the GPIO. Copying SWs state to respective LEDs\r');

        state_now = rdGPIO(SW5); //read pushbutton 5 and invert its value...
        wrGPIO(LED1,state_now); //...then copy its value to LED 1
        state_now = rdGPIO(SW6); //read pushbutton 6 and invert its value...
        wrGPIO(LED2,state_now); //...then copy its value to LED 2
}
