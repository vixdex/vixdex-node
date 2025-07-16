const express = require('express');
require('dotenv').config();
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
var { ethers } = require('ethers');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuid } = require('uuid');
const { startEventListener } = require('./services/eventListener');

const app = express();
const server = http.createServer(app);

//imports of schema
const PriceSchema = require('./schema/PriceSchema');

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
});

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importing routes
const volumeRouter = require('./router/Volume');
const eventsRouter = require('./router/events');

// Routes
app.use('/volume', volumeRouter);
app.use('/api/events', eventsRouter);

app.get('/', (req, res) => {
  res.status(200).send({
    message: 'Welcome to the API',
  });
});

app.get('/prices/:poolAddress', async (req, res) => {
  let poolAdd = req.params.poolAddress;
  let resp = await PriceSchema.findOne({ poolAddress: poolAdd });
  if (!resp) {
    res.status(400).send({ msg: 'no data found' });
  } else {
    res.status(200).send({
      msg: 'data found',
      data: resp,
    });
  }
});

server.listen(process.env.PORT || 8000, () => {
  console.log(`Server is running on port ${process.env.PORT || 8000}`);
});

let socketProvider = new ethers.WebSocketProvider(process.env.WSS_RPC_URL);
let contractAdd = process.env.VIXDEX_HOOK_ADDRESS;
const abi = [
  'event AfterVPTSwap(address indexed poolAddress,uint256 iv,uint256 price0,uint256 price1,uint256 timeStamp)',
];

const contract = new ethers.Contract(contractAdd, abi, socketProvider);

console.log('Listening for Transfer events...');
console.log('contract address: ', contractAdd);

async function storePriceInDB(data) {
  let isThere = await PriceSchema.findOne({ poolAddress: data.poolAddress });
  if (!isThere) {
    let newData = new PriceSchema({
      poolAddress: data.poolAddress,
      chart: [
        {
          time: data.timeStamp,
          price0: data.price0,
          price1: data.price1,
          iv: data.iv,
        },
      ],
    });

    let res = await newData.save();
    return res;
  } else {
    let res = await PriceSchema.updateOne(
      { _id: isThere._id },
      {
        $push: {
          chart: {
            time: data.timeStamp,
            price0: data.price0,
            price1: data.price1,
            iv: data.iv,
          },
        },
      }
    );

    return res;
  }
}

const STATIC_ROOM_ID = uuid();
console.log('room id: ', STATIC_ROOM_ID);
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.join(STATIC_ROOM_ID);

  io.to(STATIC_ROOM_ID).emit('connectedMsg');
  contract.on('AfterVPTSwap', (poolAddress, iv, price0, price1, timeStamp) => {
    console.log({
      poolAddress,
      iv,
      price0,
      price1,
      timeStamp,
    });

    //storing in db

    (async () => {
      let res = await storePriceInDB({
        poolAddress: poolAddress,
        iv: Number(iv),
        price0: Number(price0),
        price1: Number(price1),
        timeStamp: Number(timeStamp),
      });

      console.log('price updated: ', res);
    })();

    //emit new Price
    console.log('emiting for new price');
    console.log(STATIC_ROOM_ID);
    io.to(STATIC_ROOM_ID).emit('newPrice', {
      poolAddress: poolAddress,
      iv: Number(iv),
      price0: Number(price0),
      price1: Number(price1),
      timeStamp: Number(timeStamp),
    });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const connectToMongo = async () => {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
    });
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    return false;
  }
};

// Start everything
const startServer = async () => {
  const dbConnected = await connectToMongo();
  if (!dbConnected) {
    console.error('❌ Failed to connect to MongoDB. Exiting...');
    process.exit(1);
  }

  // Start the Express server
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });

  // Start the event listener
  try {
    console.log('🚀 Starting event listener...');
    await startEventListener();
    console.log('✅ Event listener started successfully');
  } catch (error) {
    console.error('❌ Failed to start event listener:', error);
    process.exit(1);
  }
};

startServer().catch(console.error);
