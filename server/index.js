const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Database
mongoose.connect("mongodb+srv://stingacristian:yvahaHi7sp3T8vKN@cluster0.wnyr4wr.mongodb.net/todolistDB?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB:", err);
    });

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const welcome = new Item({
    name: "Welcome to your toDo list!"
});

const defaultItems = [welcome];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
    Item.find({}).then(function (foundItems) {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems);
            res.redirect("/")
        } else {
            res.render("list", { listTitle: "Today", newListItem: foundItems });
        }

    }).catch(function (err) {
        console.error("Error finding items:", err);
        res.status(500).send("Internal Server Error");
    });
});

app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save().then(() => {
            res.redirect("/");
        }).catch((err) => {
            console.error("Error saving item:", err);
            res.status(500).send("Internal Server Error");
        });
    } else {
        List.findOne({ name: listName }).then(function (foundList) {
            if (!foundList) {
                console.error("List not found:", listName);
                res.status(404).send("List not found");
            } else {
                foundList.items.push(item);
                foundList.save().then(() => {
                    res.redirect("/" + listName);
                }).catch((err) => {
                    console.error("Error saving list:", err);
                    res.status(500).send("Internal Server Error");
                });
            }
        }).catch((err) => {
            console.error("Error finding list:", err);
            res.status(500).send("Internal Server Error");
        });
    }
});

app.post("/delete", function (req, res) {
    const checkedItemId = new mongoose.Types.ObjectId(req.body.checkbox);
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndDelete(checkedItemId).then(function () {
            console.log("Success");
            res.redirect("/")
        }).catch(function (err) {
            console.error("Error deleting item:", err);
            res.status(500).send("Internal Server Error");
        });
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }).then(function (foundList) {
            res.redirect("/" + listName);
        }).catch((err) => {
            console.error("Error updating list:", err);
            res.status(500).send("Internal Server Error");
        });
    }
});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName }).then(function (foundList) {
        if (!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems
            });

            list.save().then(() => {
                res.redirect("/" + customListName);
            }).catch((err) => {
                console.error("Error saving list:", err);
                res.status(500).send("Internal Server Error");
            });
        } else {
            res.render("list", { listTitle: foundList.name, newListItem: foundList.items })
        }
    }).catch((err) => {
        console.error("Error finding list:", err);
        res.status(500).send("Internal Server Error");
    });
});

let port = process.env.PORT || 3000;

app.listen(port, function () {
    console.log("Server has started successfully");
});
