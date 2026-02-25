import jwt from "jsonwebtoken";
import express from "express";
import cookieParser from "cookie-parser";

const app=express()
app.use(cookieParser())
function verifyToken(req,res,next){
    // const authHeader=req.headers.authorization
    const token=req.cookies.token

    if(!token)  return res.status(401).json({message:"Unauthorized"})
        // const token=authHeader.split(" ")[1]
       console.log(token)
        jwt.verify(token,process.env.JWT_SECRET,(err,decoded)=>{
        if(err){
        return res.status(403).json({message:"Invalid Token"})
        }

        req.id=decoded.id
        req.role=decoded.role
        console.log(req.id)
        next();
})

}

export default verifyToken; 
