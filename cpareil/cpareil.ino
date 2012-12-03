
/**************************************
cpareil
DESCRIPTION program that drives nonpareil dispenser according to timer and web input
History: 
created 11.25.2012

***************************************/

//#include <stdlib.h>
#include <Servo.h>
#include <Timer.h>

#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiServer.h>
//#define PINTERVAL 10000  //poling interval in ms 
int ROTATION = 1100; //12 rotation

int ledPin = 5;  // LED connected to digital pin
int servoPin = 9; //Servo Pin
int ledVal = 255;
int ledStep = 1;
boolean bufFlag = false;
String sbuf = "";

//**************** WIFI ****************
char ssid[] = "NETWORK_NAME";     // the name of your network
int status = WL_IDLE_STATUS;     // the Wifi radio's status
WiFiClient client;
char server[]="SERVER_NAME";
//char server[] = "www.google.com";


//**************** Poling ****************
unsigned long lastConnectionTime = 0;           // last time connected to the server, in milliseconds
boolean lastConnected = false;                  // state of the connection last time through the main loop
const unsigned long postingInterval = 15*1000;  // delay between updates, in milliseconds;  // delay between updates, in milliseconds



//**************************************


Servo myservo;  // create servo object to control a servo 

void setup()
{
  Serial.begin(9600);
      Serial.print("Setup Initiated");
  pinMode(ledPin, OUTPUT);      // sets the digital pin as output
myservo.attach(servoPin);  // attaches the servo on pin 9 to the servo object 
myservo.write(90); //important otherwise servo will peform 360 degree rotation by default
//moveDispenser(1);

  // attempt to connect to Wifi network:
  while ( status != WL_CONNECTED) { 
    Serial.print("Attempting to connect to SSID: ");
    Serial.println(ssid);
    status = WiFi.begin(ssid);
    // wait 10 seconds for connection:
    delay(10000);
  } 
  Serial.println("Connected to wifi");
  printWifiStatus();
  
 


}

void loop()
{
  //static unsigned long lastTick = 0;
  
  analogWrite(ledPin, getLEDValue());   // fade the LED
      delay(10);


//if there is incoming data from the net connection read it.
while (client.available()) {
     //cbuf[0] = client.read(); cbuf[1] = 0;
    sbuf=""; 
    char c = client.read();
    sbuf += c;
    
    //Serial.write("c: ");
    //Serial.write(c);
    //Serial.write("sbuf: ");
    
    //Serial.write(sbuf);
    
    
    if(bufFlag){
  //   Serial.println("move dispenser ");
  //   Serial.write(cbuf);
  //   Serial.println("finish moving dispenser ");
      
       if(sbuf=="1") moveDispenser(1); //move the dispenser 
       if(sbuf=="2") moveDispenser(2); //move the dispenser 
       if(sbuf=="3") moveDispenser(12); //move the dispenser
       bufFlag = false;
       sbuf = "";
    }
    
      //signal that next character is a response to API call
      if(sbuf=="#"){ bufFlag = true;    
      Serial.write("# detected"); //for debugging
      }  
}

    // if there's no net connection, but there was one last time
  // through the loop, then stop the client:
  if (!client.connected() && lastConnected) {
    Serial.println();
    Serial.println("disconnecting, stopping client");
    client.stop();
  }
  
  // if you're not connected, and ten seconds have passed since
  // your last connection, then connect again and send data:
  if(!client.connected() && (millis() - lastConnectionTime > postingInterval)) {
      
    httpRequest();
  }
  // store the state of the connection for next time through
  // the loop:
  lastConnected = client.connected();  
  

}


/**************************************
getLEDValue()
DESCRIPTION controls fade of LED indicator light
History: 
created 11.25.2012
***************************************/
int getLEDValue(){
  ledVal += ledStep; // increment or decrement
if (ledVal <0){ledVal = 0; ledStep = 1;}
if (ledVal >255){ledVal = 255; ledStep = -1;}
  
  return ledVal;
}


/**************************************
printWifiStatus()
DESCRIPTION get Wifi status
History: 
created 11.25.2012
***************************************/

void printWifiStatus() {
  // print the SSID of the network you're attached to:
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  // print your WiFi shield's IP address:
  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);

  // print the received signal strength:
  long rssi = WiFi.RSSI();
  Serial.print("signal strength (RSSI):");
  Serial.print(rssi);
  Serial.println(" dBm");
}



/**************************************
httpRequest()
DESCRIPTION this method makes a HTTP connection to the server
History: Tom Igoe May 31, 2012
***************************************/
void httpRequest() {
  // if there's a successful connection:
  if (client.connect(server, 80)) {
    Serial.println("connecting...");
    // send the HTTP PUT request:
    client.println("GET /?gs=1 HTTP/1.1");
    client.println("HOST NAME HERE");
    client.println("User-Agent: arduino-ethernet");
    client.println("Connection: close");
    client.println();

    // note the time that the connection was made:
    lastConnectionTime = millis();
  } 
  else {
    // if you couldn't make a connection:
    Serial.println("connection failed");
    Serial.println("disconnecting.");
    client.stop();
  }
}



/**************************************
moveDispensor(int steps)
DESCRIPTION move dispenser clockwise number of steps
History: 
created 11.25.2012
***************************************/

void moveDispenser(int steps){
   Serial.println("inside moveDispenser steps --> ");
  myservo.write(89); 
   delay(steps * ROTATION); // 1/12 turn clockwise at 89'
   myservo.write(90); //stop
  
  }
 
