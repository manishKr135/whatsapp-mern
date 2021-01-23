//importing
 import express from 'express';
 import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from "pusher";
import cors from 'cors';
// const express = require('express');
//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1142295",
    key: "f8ae7da8a2c156c3de12",
    secret: "fa6ca86cb6084123448d",
    cluster: "ap2",
    useTLS: true
  });


//middlewares
app.use(express.json());

app.use(cors());
/*
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
    
});
*/

//DB config
const connection_url = "mongodb+srv://manish135:014725830aA@cluster0.guflp.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.once('open', () => {
    console.log("DB Connected");
    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => {
        console.log(change);

        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
                timeStamp: messageDetails.timeStamp,
                received: messageDetails.received
            });
        } else{
            console.log("Error triggering Pusher");
        }
    });
});
//????

//api routes
app.get('/', (req, res) => {
    res.status(200).send("hello world");
});

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(200).send(data);
        }
    });
});

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err);
        }
        else{
            res.status(201).send(data);
        }
    });
});

//listen
app.listen(port, ()=> {
    console.log(`Listening to the port: ${port}`);
});