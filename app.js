const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

mongoose.connect("mongodb://127.0.0.1:27017/ItemsDB", { useNewURLParser : true });

const itemsschema = new mongoose.Schema({
  name : String
})

const listschema = new mongoose.Schema({
  name : String,
  items : [itemsschema]
})

const Item = mongoose.model("Item",itemsschema);
const List = mongoose.model("List",listschema);

const t1 = new Item({
  name : "Welcome to ToDoList"
});

const t2 = new Item({
  name : "Hit the + button to add a new item"
});

const t3 = new Item({
  name : "<-- Hit this to delete an item"
});

const items_array = [t1,t2,t3];

async function default_insert(){
  await Item.insertMany(items_array);
}

async function insert_item(n){
  await Item.create(new Item({
    name : n
  }));
}

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", function(req, res) {

  const day = date.getDay();
  const item_list = [];
  async function find(){
    const found_items = await Item.find();
    if(found_items.length == 0){
      default_insert();
    }
    res.render("list", {listTitle: day, newListItems: found_items});
  }
  find();

});

app.post("/", function(req, res){
  const route = req.body.list;
  const item = req.body.newItem;
  if(route == date.getDay()){
    insert_item(item);
    res.redirect("/");
  } else{
    async function update_list(){
      const l = new Item({
        name : item
      })
      const list = await List.updateOne({name:route},{$push: { items: l }})
    }
    update_list();
    res.redirect("/"+ route);
  }
});

app.get("/:route",function(req,res){
  const custom_route =  _.capitalize(req.params.route);
  async function find_list(){
    const row = await List.findOne({name:custom_route});
    if(row === null){
      const list = new List({
        name: custom_route,
        items: items_array
      });
      list.save();
    }
    res.render("list", {listTitle: row.name, newListItems: row.items});
  }
  find_list();
});

app.post("/delete",function(req,res){
  if(req.body.listname === date.getDay()){
    async function delete_item(id){
      await Item.deleteOne({_id: id});
    }
    delete_item(req.body.checkbox);
    res.redirect("/");
  }
  else{
    async function del(id){
      await List.findOneAndUpdate({name:req.body.listname}, { $pull: {items : { _id : id }} });
      res.redirect("/"+req.body.listname);
    }
    del(req.body.checkbox);
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
