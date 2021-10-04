const express = require("express");
const { WebhookClient, Payload } = require("dialogflow-fulfillment");
const MongoClient = require("mongodb").MongoClient;
const randomstring = require("randomstring");

const app = express();

// Database variables
dbUrl = "mongodb://localhost:27017/";
dbName = "ChatBot";

function WebhookProcessing(req,res){
    const agent = new WebhookClient({ request : req, response : res});
    // mapping wtih the intes=nts in dialogflow
    let intentMap = new Map();
    
    intentMap.set("service_intent",identify_user);
    intentMap.set("service_intent - custom",custom_payload);
    intentMap.set("service_intent - custom - custom",report_issue);

    agent.handleRequest(intentMap);//hadles reqs from dialogflow

}
let client = new MongoClient(dbUrl,{useNewUrlParser : true , useUnifiedTopology : true});
let user_name = "";
let phoneNum = 0;

async function identify_user(agent){
    let phoneNumber = agent.parameters.acct_num;
    phoneNum = phoneNumber;
    
    await client.connect();
    
    let isUser = await client.db(dbName).collection("User_Details").findOne({ PhoneNo : phoneNum });
    
    if(isUser == null){
        await agent.add("User not found. Check your mobile number again");
    }
    else{
        user_name = isUser.Username;
        await agent.add("Welcome " + user_name + "! \nHow can I assist you?")
    }    
}

function custom_payload(agent){
    let payloadData = 
    {
        "richContent":
        [
            [
                {
                    "type": "list",
                    "title": "Internet Down",
                    "subtitle": "Press '1' for Internet is down",
                    "event": {
                        "name": "",
                        "languageCode": "",
                        "parameters": {}
                    }
                },
                {
                    "type":"divider"
                },
                {
                    "type": "list",
                    "title": "Slow Internet",
                    "subtitle": "Press '2' for Slow Internet",
                    "event": {
                        "name": "",
                        "languageCode": "",
                        "parameters": {}
                    }
                },
                {
                    "type":"divider"
                },
                {
                    "type":"list",
                    "title":"No connectivity",
                    "subtitle":"Press '3' for No connectivity",
                    "event":{
                        "name": "",
                        "languageCode": "",
                        "parameters": {}
                    }
                },
                {
                    "type":"divider"
                },
                {
                    "type":"list",
                    "title":"Wifi router not working",
                    "subtitle": "Press '4' for Wifi router not working",
                    "event": {
                        "name": "",
                        "languageCode": "",
                        "parameters":{}
                    }
                }
            ]
        ]
    }

    agent.add(new Payload(agent.UNSPECIFIED,payloadData,{sendAsMessage:true,rawPayload:true}));
}

async function report_issue(agent){
        
    let issues = { 1 : "Internet down" , 2 : "Slow internet" , 3 : "No connectivity" , 4 : "Wifi Router not working"};

    const selected_option = agent.parameters.issue_num;

    let issue = issues[selected_option];

    let ticket_number = randomstring.generate(10);

    // let client = new MongoClient(dbUrl,{ useNewUrlParser : true , useUnifiedTopology : true});
    await client.connect();

    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();
    let hours = date.getHours();
    let min = date.getMinutes();

    let final_date = day + "/" + month + "/" + year + "  " + hours + ":" + min;
    let userName = user_name;
    let mobileNo = phoneNum;
    let ticket_no = ticket_number;
    let finalIssue = issue;

    let finObj = {Username : userName , PhoneNo : mobileNo , Ticket_Number : ticket_no , Issue : finalIssue , Date : final_date, Status : "Pending"};

    let insertSuccessfull = await client.db(dbName).collection("Issue_Details").insertOne(finObj);

    await agent.add("Your issue is reported. Here are the details : \n Ticket Number : " + ticket_number + " \n " + "Issue : " + issue);
    
}

app.post('/dialogflow/',express.json(),function (req,res) {
    WebhookProcessing(req,res);
});


app.listen(8080,() =>{
    console.log("Listening to port 8080");
});