
import express from "express"
import cors from "cors";
import start from "./start.js";
import play from "./play.js";
const app = express()
app.use(cors());
app.use(express.json());
const port = 3000;

app.get('/', async(req, res) => {
    const data = await start(req);
    res.status(data['status']).json({data:data['data']});
});

app.post('/play/', async(req, res)=>{
    const data = await play(req);
    res.status(data['status']).json({data:data['data']});
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
