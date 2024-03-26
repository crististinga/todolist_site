const express = require("express");
const bodyParser  = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();


app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Database

mongoose.connect("mongodb+srv://stingacristian:yvahaHi7sp3T8vKN@cluster0.wnyr4wr.mongodb.net/todolistDB?retryWrites=true&w=majority&appName=Cluster0");

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema)

const welcome = new Item({
    name: "Welcome to your toDo list!"
})

const defaultItems = [welcome];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema)

app.get("/", function (req, res) {

    Item.find({}).then(function(foundItems){
        if (foundItems.length === 0){
            Item.insertMany(defaultItems);
            res.redirect("/")
        } else {
            res.render("list", {listTitle: "Today", newListItem: foundItems});
        }

    }).catch(function(err){
        console.log(err)
    })


})

app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item ({
        name: itemName
    });

    if(listName === "Today") {
        item.save();
        res.redirect("/")
    } else {
        List.findOne({name: listName}).then(function(foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        }).catch()
    }

})

app.post("/delete", function (req, res){
    const checkedItemId = new mongoose.Types.ObjectId(req.body.checkbox);
    const listName = req.body.listName;

    if (listName === "Today"){
        Item.findByIdAndDelete(checkedItemId).then(function () {
            console.log("succes");
            res.redirect("/")
        }).catch(function (err){
            console.log(err)
        })
    } else {
        List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}} ).then(function(foundList){
            res.redirect("/" + listName);
        }).catch()
    }

})

app.get("/:customListName", function (req,res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}).then(function (foundList){
        if(!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems
            })

            list.save();
            res.redirect("/" + customListName);
        } else {
            res.render("list", {listTitle: foundList.name, newListItem: foundList.items})
        }
    }).catch(function (err){
        console.log(err)
    })




})

let port = process.env.PORT;
if(port == null || port == "") {
    port = 3000;
}


app.listen(port, function () {
    console.log("Server has started successfully");
})

