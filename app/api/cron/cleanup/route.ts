import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary } from "@/lib/cloudinary";


export async function GET(req: NextRequest) {

  const auth = req.headers.get("authorization");

  if (
    auth !==
    `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized"
      },
      {
        status:401
      }
    );
  }


  const expired =
    await prisma.share.findMany({
      where:{
        expiresAt:{
          lt:new Date()
        }
      },
      include:{
        files:true
      }
    });


  let deletedShares = 0;
  let deletedFiles = 0;


  for(const share of expired){

    let cloudinaryFailed = false;


    for(const file of share.files){

      try{

        await deleteFromCloudinary(
          file.publicId
        );

        deletedFiles++;

      }catch(error){

        console.error(
          "Cloudinary delete failed",
          error
        );

        cloudinaryFailed = true;
      }
    }


    // Do not remove DB record
    // if Cloudinary deletion failed
    if(cloudinaryFailed){
      continue;
    }


    await prisma.share.delete({
      where:{
        id:share.id
      }
    });


    deletedShares++;

  }


  return NextResponse.json({
    deletedShares,
    deletedFiles
  });

}