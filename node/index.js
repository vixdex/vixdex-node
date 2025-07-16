var express = require('express');
require('dotenv').config();
var morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
var {ethers} = require("ethers")
const http = require('http');
const { Server } = require('socket.io');
const {v4: uuid} = require("uuid")
var app = express();
const server = http.createServer(app)

//imports of schema
const PriceSchema = require('./schema/PriceSchema');

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
  }
});

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


app.get('/prices/:poolAddress',async(req,res)=>{
    let poolAdd = req.params.poolAddress;
    let resp = await PriceSchema.findOne({poolAddress:poolAdd});
    if(!resp){
        res.status(400).send({msg:"no data found"})
    }else{
        res.status(200).send({
            msg:"data found",
            data:resp
        })
    }
})

server.listen(process.env.PORT||8000, () => {
    console.log(`Server is running on port ${process.env.PORT||8000}`);
});

let socketProvider = new ethers.WebSocketProvider(process.env.WSS_RPC_URL);
let contractAdd = process.env.VIXDEX_HOOK_ADDRESS
const abi = [
    "event AfterVPTSwap(address indexed poolAddress,uint256 iv,uint256 price0,uint256 price1,uint256 timeStamp)"
];



const contract = new ethers.Contract(contractAdd, abi, socketProvider);

console.log("Listening for Transfer events...");
console.log("contract address: ", contractAdd);


async function storePriceInDB(data){
let isThere = await PriceSchema.findOne({poolAddress: data.poolAddress});
if(!isThere){
    let newData = new PriceSchema({
        poolAddress:data.poolAddress,
        chart:[{
            time: data.timeStamp,
            price0: data.price0,
            price1: data.price1,
            iv:data.iv
        }]
    })

    let res = await newData.save();
    return res;
}else{
   let res =  await PriceSchema.updateOne({_id:isThere._id},{
        $push:{
            chart:{
                time: data.timeStamp,
                price0: data.price0,
                price1: data.price1,
                iv:data.iv
            }
        }
    })

    return res;
}

}

const STATIC_ROOM_ID = uuid()
console.log("room id: ",STATIC_ROOM_ID)
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.join(STATIC_ROOM_ID);
    
    io.to(STATIC_ROOM_ID).emit("connectedMsg")
    contract.on("AfterVPTSwap", (poolAddress, iv, price0, price1, timeStamp) => {
        console.log({
            poolAddress,
            iv,
            price0,
            price1,
            timeStamp
        });

        //storing in db

        (async()=>{
            let res = await storePriceInDB({
    poolAddress: poolAddress,
    iv: Number(iv),
    price0: Number(price0),
    price1: Number(price1),
    timeStamp: Number(timeStamp)
}
)

            console.log("price updated: ",res);

        })()

        //emit new Price
        console.log("emiting for new price")
        console.log(STATIC_ROOM_ID)
        io.to(STATIC_ROOM_ID).emit("newPrice",{
    poolAddress: poolAddress,
    iv: Number(iv),
    price0: Number(price0),
    price1: Number(price1),
    timeStamp: Number(timeStamp)
});
        });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });

  });

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
