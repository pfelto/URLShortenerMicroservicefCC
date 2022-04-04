require('dotenv').config();
const express = require('express');
const dns = require('dns');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mySecret = process.env['MONGO_URI']

mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true })

const urlSchema = new Schema({
  shortenedURL: {type: String, unique: true},
  originalURL: {type: String, unique: true}
});

const TheURL = mongoose.model("TheURL",urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.get("/api/shorturl/:number",(req,res) => {
  TheURL.findOne({ shortenedURL: req.params.number }, function (err, url) {
    if(err) console.log(err);
    if(!url){
      res.json({error:"No short URL found for the given input"});
    }
    res.redirect(url.originalURL);
    });
})  
//need to use express middleware and change the url after post is complete
//1. Validate the url is good: if not then return bad json
//2. if good create a record and save it and then return correct json
//3. Then reroute to url base + /api/shorturl
//4. Need a .get(/api/shorturl/:number)
//5. Check if number is in DB, if it is then redirect, else {"error":"No short URL found for the given input"}

app.post("/api/shorturl", function (req,res) {
      const originalURL = req.body.url;
      let urlObject; 
      try {
        urlObject = new URL(originalURL);
      } catch(err){
        res.json({error: 'invalid url'});
        return;
      }
      dns.lookup(urlObject.hostname,(err,address,family)=>{
        if(err){
           res.json({
            error: 'invalid url'
        });
        }else{
          var shortenedURL = Math.floor(Math.random() * 100000).toString();
          const myURL = new TheURL({shortenedURL: shortenedURL, originalURL: originalURL })
          myURL.save(function(err){
            if (err){
              if(err.code === 11000){
                TheURL.findOne({ originalURL: originalURL }, function (err, url) {
                  if(err) console.log(err);
                  res.json({original_url: url.originalURL, short_url:     
url.shortenedURL});
                });
              }
              return;
            } 
            res.json({original_url: originalURL, short_url: shortenedURL});
          })
        }
    })
})

 

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
