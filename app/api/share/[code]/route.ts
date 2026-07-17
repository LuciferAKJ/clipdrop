import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { deleteFromCloudinary } from "@/lib/cloudinary";


// Metadata only
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code:string }> }
){

  const {code}=await params;


  const share = await prisma.share.findUnique({
    where:{
      code:code.toUpperCase()
    }
  });


  if(!share){
    return NextResponse.json(
      {error:"Not found"},
      {status:404}
    );
  }


  if(share.expiresAt < new Date()){
    return NextResponse.json(
      {error:"Expired"},
      {status:410}
    );
  }


  return NextResponse.json({
    requiresPassword:
      !!share.passwordHash
  });

}



// Actual download
export async function POST(
 req:NextRequest,
 {params}:{params:Promise<{code:string}>}
){

 const {code}=await params;


 const {password}=await req.json()
 .catch(()=>({password:null}));



 const share=await prisma.share.findUnique({
  where:{
    code:code.toUpperCase()
  },
  include:{
    files:true
  }
 });



 if(!share){
  return NextResponse.json(
   {error:"Not found"},
   {status:404}
  );
 }



 if(share.expiresAt < new Date()){
  return NextResponse.json(
   {error:"Expired"},
   {status:410}
  );
 }



 if(share.passwordHash){

  const valid =
   password &&
   await verifyPassword(
    password,
    share.passwordHash
   );


  if(!valid){
   return NextResponse.json(
    {error:"Invalid password"},
    {status:401}
   );
  }
 }



 const responseData={
  textContent:share.textContent,
  files:share.files,
  createdAt:share.createdAt
 };



 if(share.oneTimeUse){


   // delete cloudinary first

   for(const file of share.files){

    await deleteFromCloudinary(
     file.publicId
    ).catch(()=>{});

   }


   await prisma.share.delete({
    where:{
     id:share.id
    }
   });


 }
 else {


   await prisma.share.update({
    where:{
     id:share.id
    },
    data:{
     downloadCount:{
      increment:1
     }
    }
   });


 }



 return NextResponse.json(responseData);

}