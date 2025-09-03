import { Keypair, Transaction, SystemProgram, NONCE_ACCOUNT_LENGTH, Connection, clusterApiUrl } from "@solana/web3.js";
import dotenv from "dotenv";
dotenv.config({ path: ".env" })
const connection = new Connection(clusterApiUrl('devnet'));
const dataBank = process.env.DATA_BANK;

export default async function start(req) {
    try {
        const pk = req.headers['pk'];
        const resp = await fetch(`${dataBank}/start/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }, body: JSON.stringify({ "pk": pk })
        });
        if (resp.status === 200) {
            const result = await resp.json();
            if (!result['atk_key']) {
                const msg = { 'status': 200, 'data': result }
                return msg;
            }
            const nonce_data = await generateNewNonce(result)
            const data = JSON.stringify({ 'nonceSecretKey': nonce_data.secretKey.toString(), 'noncePubKey': nonce_data.publicKey, "ownerPubKey": pk });
            const newResult = await submitNonce(data);
            const msg = { 'status': 200, 'data': newResult }
            return msg;
        }
    } catch (error) {
        console.log(error);
        const msg = { 'status': 500, 'data': 'Interval Server Error' }
        return msg;
    }
}


async function generateNewNonce(result) {
    try {
        const key = new Uint8Array(JSON.parse(result['atk_key']));
        const atk = Keypair.fromSecretKey(key);
        const new_nonce = Keypair.generate();
        const lamports = await connection.getMinimumBalanceForRentExemption(NONCE_ACCOUNT_LENGTH);


        const create = SystemProgram.createAccount({
            fromPubkey: atk.publicKey,
            newAccountPubkey: new_nonce.publicKey,
            lamports,
            space: NONCE_ACCOUNT_LENGTH,
            programId: SystemProgram.programId
        });

        const init = SystemProgram.nonceInitialize({
            noncePubkey: new_nonce.publicKey,
            authorizedPubkey: atk.publicKey
        });

        const tx = new Transaction()
        tx.feePayer = atk.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        tx.add(create)
        tx.add(init)
        const signature = await connection.sendTransaction(tx, [atk, new_nonce]);
        await connection.confirmTransaction(signature, 'confirmed');
        return new_nonce
    } catch (error) {
        console.log(error);
    }

}

async function submitNonce(data) {
    const resp = await fetch(`${dataBank}/submit-nonce/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: data
    });
    if (resp.status !== 200) {
        await submitNonce(data);
    } else {
        const result = await resp.json();
        return result;
    }
}