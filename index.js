
import express from "express"
import cors from "cors";
import start from "./start.js";
import play from "./play.js";
import dotenv from "dotenv";

if(!process.env.DATA_BANK){
    dotenv.config();
}
const app = express()
app.use(cors());
app.use(express.json());
const port = 3000;

app.get('/', (req, res)=>{
    res.status(200).json({'msg':"Welcome"});
});

app.get('/start', async(req, res) => {
    const data = await start(req, process.env.DATA_BANK);
    res.status(data['status']).json({data:data['data']});
});

app.post('/play/', async(req, res)=>{
    const data = await play(req, process.env.DATA_BANK);
    res.status(data['status']).json({data:data['data']});
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
