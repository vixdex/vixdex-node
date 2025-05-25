var express = require('express');
require('dotenv').config();
var morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
var app = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importing routes
var volumeRouter = require('./router/Volume');
app.use("/volume", volumeRouter);

app.get('/',(req,res)=>{
    res.status(200).send({
        message: 'Welcome to the API'
    });
})


app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is running on port ${process.env.PORT || 8000}`);
}
);

const connectToMongo = async () => {
    try{
        mongoose.set('strictQuery', false); // To avoid deprecation warning
        await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 10, // Optional: Adjust the pool size as needed
            
        });
        console.log("Connected to MongoDB");
    }catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

connectToMongo();