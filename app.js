//jshint esversion:6
require('dotenv').config();
//console.log(process.env)


const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const app = express();

//console.log(process.env.secret);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// will connect data inside robot 3T
mongoose.connect("mongodb://127.0.0.1:27017/cpt32-userDB");
mongoose.connection.on('connected', () => console.log('mongoDB Connected'));
mongoose.connection.on('error', () => console.log('Connection failed with - '));

const userSchema = new mongoose.Schema({
  email:String,
  password:String
});


userSchema.plugin(encrypt, { secret:process.env.secret, encryptedFields: ['password'] });

const User = new mongoose.model("User", userSchema);



app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.post("/register", function(req, res){
  const newUser = User({
    email:req.body.username,
    password: req.body.password
  });

  console.log("Prepare to save the new user!")
  newUser.save(function(err){
    if(err){
      console.log(err)
    }else{
      res.render("login");
    }
  })

});


app.post("/login", function(req, res){

  const username = req.body.username;
  const password = req.body.password;
  console.log("Prepare to go to login!");

  User.findOne({email:username}, function(err, foundUser){
    if (err){
      console.log(err);
    }else{
      if (foundUser){
        if (foundUser.password === password){
          res.render("secrets");
        }
      }
    }
  });
});





app.listen(3000, function() {
  console.log("Server started on port 3000");
});
