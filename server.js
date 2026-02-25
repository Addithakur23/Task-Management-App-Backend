import express from "express"
import mongoose from "mongoose" 
import dotenv from "dotenv"
import cors from "cors"
import { User } from "./models/User.js"
import { Tasks } from "./models/Task.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import verifyToken from "./middleware/authmiddleware.js"
import cookieParser from "cookie-parser"


const app=express()
const port =3000
app.use(express.json())
app.use(cors({origin:"https://task-management-app-smoky-five.vercel.app",credentials:true}))
app.use(cookieParser())
dotenv.config()
await mongoose.connect(process.env.MONGO_URI)

app.post('/api/Signup', async(req, res) => {
try { 
  let {Name,Email,Password}=req.body
  if(!Email.endsWith("@gmail.com")){
     return res.status(400).json({message:"Only Gamil addresses are allowed ❌"})
  }
  let salt=await bcrypt.genSalt(10)
  let hashedPassword=await bcrypt.hash(Password,salt)
console.log(req.body)
  const user=await User.create({
    Name,
    Email,
    Password:hashedPassword
  })

  res.status(201).json({
    success:true,
    data:user
  })
}
catch(error){
  res.status(500).json({success:false,message:error.message})
}

})

app.post('/api/Login', async(req, res) => {
  console.log(req.body)
 try {
  let {Email,Password}=req.body
  let user=await User.findOne({Email})
  if(!user){
    return res.status(401).json({message:"Invalid Credentials"})
  }
  let isMatch=await bcrypt.compare(Password,user.Password)
  console.log(isMatch)
  if(!isMatch){
    return res.status(401).json({message:"Invalid Credentials"})
  }
  const token=jwt.sign({id:user._id,role:user.role},process.env.JWT_SECRET,{expiresIn:"1d"})
  res.cookie("token",token,{
    httpOnly:true,
    secure:process.env.NODE_ENV=="Production",
    sameSite:"lax"
  })
  return res.status(200).json({success:true})

}
 catch(error){
  res.status(500).json({message:error.message})
 }
  
})


//for notes
app.get('/api/tasks',verifyToken, async(req, res) =>{
  const data=await Tasks.find({user:req.id})
  console.log(data)
  res.json(data)
})

app.post('/api/tasks',verifyToken, async(req, res) =>{
   try{
   
    const {Title,Description,Status}=req.body
    console.log(req.body)
   const task=await Tasks.create({
    Title,Description,Status,user:req.id
   })
   
   res.status(201).json({success:true,data:task})}
   catch(error){
      res.status(500).json({success:true,message:error.message})
   }

})

app.delete('/api/tasks/:id',verifyToken, async(req, res) =>{
try { const task=await Tasks.deleteOne({_id:req.params.id,user:req.id})
  if(task.deletedCount==0){
    return res.status(404).json({message:"Task not found"})
  }
  res.json({message:"Task Deleted Successfully"})}
  catch(error){
    res.status(500).json({message:error.message})
  }
  
})

app.put('/api/tasks/:id',verifyToken, async(req, res) =>{
  const updateTask=await Tasks.findByIdAndUpdate({_id:req.params.id,user:req.id},{Title:req.body.Title,Description:req.body.Description,Status:req.body.Status},{new:true})
  if(!updateTask){
    res.status(400).json({message:"Note not Found"})
  }
res.json(updateTask)

})


app.get("/api/me",verifyToken,async(req, res) =>{
 try{ const user=await User.findById(req.id).select("-Password")
  if(!user){
    res.status(404).json({message:"User not found"})
  }
  res.status(200).json(user)}
  catch(err){
    res.status(500).json({message:err.message})
  }
})

app.post("/api/logout",verifyToken,async(req, res) =>{
  res.clearCookie("token",{
    httpOnly:true,
    secure:false,
    sameSite:"lax"
  })
  res.status(200).json({message:"Logged out"})
  

})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})