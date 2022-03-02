const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

const myModule = require('./mymodule');
const database = require('./secret');

let carts = [];
let name_box = [];
let cart_count = 0;
let total_price = 0;
let quantity = 0;
let multiple = false;
let multiple_quantity = 0;
let multiple_product = "";
let name = "";
let multiple_id = "";
let product_checkout = [];
let checkout_Total = 0;


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.use(session({
  secret:database.databaseCode,
  resave:false,
  saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://127.0.0.1:27017/"+database.databaseName);
mongoose.connection.on('connected', () => console.log('mongoDB Connected'));
mongoose.connection.on('error', () => console.log('Connection failed with - '));

const userSchema = new mongoose.Schema({
  email:String,
  password:String
});

userSchema.plugin(passportLocalMongoose);

const contactSchema = new mongoose.Schema({
  fullname:String,
  email:String,
  message:String
});

const checkOutSchema = new mongoose.Schema({
  firstname:String,
  lastname:String,
  username:String,
  email:String,
  mainAddress:String,
  optionalAddress: String,
  zipCode: Number
});

const User = new mongoose.model("User", userSchema);
const Contact = new mongoose.model("Contact", contactSchema);
const Checkout = new mongoose.model("Checkout", checkOutSchema);


passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/***************************Get  area **************************************/
app.get("/", function(req, res){
  res.render("home");
});

app.get("/meat", function(req, res){
  res.render("meat");
});

app.get("/vegetable", function(req, res){
  res.render("vegetable");
});

app.get("/fruits", function(req, res){
  res.render("fruits");
});

app.get("/products", function(req, res){
  res.render("all-products");
});

app.get("/all-products", function(req, res){
  res.render("all-products");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/home", function(req, res){
  if (req.isAuthenticated()){
    console.log("go home page after checked the password");
    res.render("/home");
  }else{
    console.log("get back to login page after checked the password");
  };

});

app.get("/contact", function(req, res){

  res.render("contact");
});


app.get("/all-products/:id", function(req,res){
  console.log(req.params.id);

  var id = req.params.id;

  multiple_id = req.params.id;
  const product = myModule[id];

  res.render("product",{product_id:id,
                        name:product.name,
                        unit:product.unit,
                        amount:product.amount,
                        price:product.price,
                        image:product.img});

});


app.get("/cart/:id", function(req, res){
  var id = req.params.id;
  var product = myModule[id];

  if (multiple===false){
    quantity = 1;
    name = product.name;
  }else{
    quantity = multiple_quantity;
    name = multiple_product;
    multiple = false;
  };

  if (name_box.includes(name)){

    let index = name_box.indexOf(name)
    cart_count = index + 1;

    newQuantity = Number(carts[index].quantity)+Number(quantity);

    newSubtotal = Math.round(product.price*newQuantity*100)/100;
    total_price = total_price-carts[index].subtotal + newSubtotal;

    carts[index].count = cart_count;
    carts[index].quantity = newQuantity;
    carts[index].subtotal = newSubtotal;

    quantity = 0;
  }else{

    cart_count += 1;
    sub_price = Math.round(product.price*quantity*100)/100;
    total_price += sub_price;
    let cart ={
      count: cart_count,
      name: name,
      unit: product.unit,
      quantity:quantity,
      price:product.price,
      subtotal: sub_price};

      name_box.push(name);
      carts.push(cart);
  };


  res.render("cart",{shoppingCarts:carts, total:Math.round(total_price*100)/100});
});

app.get("/cart" , function(req, res){
  res.render("cart",{shoppingCarts:carts, total:Math.round(total_price*100)/100});
});

app.get("/product/checkout", function(re1, res){
  res.render("checkout",{checkOut:product_checkout, checkOut_total_price:checkout_Total,length:product_checkout.length});
});


app.get("/checkout", function(re1, res){
  res.render("checkout",{checkOut:carts, checkOut_total_price:Math.round(total_price*100)/100,length:carts.length});
});


/***************************Post  area **************************************/

app.post("/register", function(req, res){
  User.register({username: req.body.username},req.body.password, function(err, user){
    if (err){
      console.log("get name and password failed in register");
      try{
        res.send("This email address has been registered, please log in directrly!");
      }catch(err){
        console.log(err);
      };
    }else{
      passport.authenticate("local")(req, res, function(){
          console.log("get name and password succeeded in register");
          res.redirect("/login");
      });
    }
  });
});


app.post("/login", function(req, res){
  const user = new User({
    username:req.body.username,
    password:req.body.password
  });

  // passport documentation
  req.login(user, function(err){
    if(err){
      console.log("log in failed");
      try{
        res.send("Your email or password is wrong, please check it before log in!");
      }catch(err){
        console.log(err);
      };
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/");
      });
    }
  });
});

app.post("/all-products/:id", function(req, res){
  var id = req.params.id;
  multiple_id = req.params.id;
  multiple_product = myModule[id].name;
  multiple_quantity = req.body.quantity;

  multiple = true;

  let checkout = {
      count:1,
      name: multiple_product,
      unit: myModule[id].unit,
      quantity:multiple_quantity,
      price:myModule[id].price,
      subtotal: Math.round((multiple_quantity*myModule[id].price*100)/100)
  };
  checkout_Total =  Math.round((multiple_quantity*myModule[id].price*100)/100);
  product_checkout.push(checkout);

});

app.post("/contactus", function(req, res){

  const contact = new Contact({
      fullname:req.body.fullname,
      email:req.body.email,
      message:req.body.message
  });
  contact.save();
  res.redirect("/");
});

app.post("/address", function(req, res){

  const checkout = new Checkout({
      firstname:req.body.firstname,
      lastname:req.body.lastname,
      username:req.body.username,
      email:req.body.email,
      mainAddress:req.body.address1,
      optionalAddress: req.body.address2,
      zipCode: req.body.zipcode
  });
  checkout.save();
  res.redirect("/");

});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
