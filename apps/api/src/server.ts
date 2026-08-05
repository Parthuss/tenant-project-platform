import 'dotenv/config'; import mongoose from 'mongoose'; import { createApp } from './app';
async function start(){await mongoose.connect(process.env.MONGO_URI||'mongodb://localhost:27017/tenant_platform');createApp().listen(Number(process.env.PORT||4000),()=>console.log('API listening'));} start();
