import express from "express";
import CommodityPostComment from "../models/ComPostComments";
import CommodityPostLike from "../models/ComPostLikes";
import CommodityPost from "../models/ComPosts";
import { getResponseBody, responseStatus, responseStatusCode } from "../utils/Utils";
import CommodityFollower from "../models/ComFollowers";

export default function mediaController(app: express.Application) {
 
  //////////////////////////////////////////// Follow a user ////////////////////////////////////

//     app.post("/api/media/follows", async (req, res) => {
//     let { followerId, followingId } = req.body;

//     try {
//       const follow = await CommodityFollower.create({
//         followerId,
//          followingId,
//         createdAt: new Date(),
//       });
//        res.status(responseStatusCode.CREATED).json(getResponseBody(responseStatus.SUCCESS,"",follow));
//     } catch (err) {
//       console.log(err);
//        res.status(responseStatusCode.BAD_REQUEST).json(getResponseBody(responseStatus.ERROR,"",err));
//     }
//   });


  // Remove a like from a post or unlike a post
  app.put("/api/media/follows/", async (req, res) => {
    const { followerId, followingId } = req.body;
    try {
      const follow = await CommodityFollower.findOne({
        where: {followerId,followingId}
      });
      
      if(follow){
        let affectedRow = await CommodityFollower.destroy({
        where: {followerId,followingId}
      });
      if (affectedRow < 1) {
         return res.status(responseStatusCode.UNPROCESSIBLE_ENTITY).json(getResponseBody(responseStatus.UNPROCESSED,"Fail to unfollow"));
      }
        return res.status(responseStatusCode.ACCEPTED).json(getResponseBody(responseStatus.SUCCESS,'Unfollowed successfully',{affectedRow})); 
      }
       const newFollow = await CommodityFollower.create({
        followerId,
        followingId,
        createdAt: new Date(),
      });
       res.status(responseStatusCode.CREATED).json(getResponseBody(responseStatus.SUCCESS,"Followed Sucessfully",newFollow));

    } catch (err) {
      console.log(err);
      res.status(responseStatusCode.BAD_REQUEST).json(getResponseBody(responseStatus.ERROR,"",err));
    }
  });


  // Get all posts
  app.get("/api/media/posts", async (req, res) => {
    try {
      const posts = await CommodityPost.findAll();
      res.status(responseStatusCode.OK).json({
        status:responseStatus.SUCCESS,
        data:posts
      });
    } catch (err) {
        console.log(err);
        res.status(responseStatusCode.BAD_REQUEST).json({
                    status: responseStatus.ERROR,
                    data:err,
                });
    }
  });

  
  // Get all user posts by userId
  app.get("/api/media/posts/:userId", async (req:express.Request, res:express.Response) => {
    const { userId } = req.params;
    
    try {
      let ids = (await CommodityFollower.findAll({where:{followerId:userId}})).map(obj => obj.getDataValue('followingId'))
    //   console.log(ids)
      const post = await CommodityPost.findAll({where:{userId:[...ids,userId]},order:[["id","DESC"]]});
      if (!post) {
        return res.status(responseStatusCode.NOT_FOUND).json({ 
            status:responseStatus.ERROR,
            message: `Post with userId ${userId} does not exist` });
      }
      res.status(responseStatusCode.OK).json({
        status:responseStatus.SUCCESS,
        data:post
      });
    } catch (err) {
      console.log(err);
            res.status(responseStatusCode.BAD_REQUEST).json({
                status: responseStatus.ERROR,
                data:err,
            });
    }
  });

  // Get a specific post by id
//   app.get("/api/media/posts/:id", async (req, res) => {
//     const { id } = req.params;

//     try {
//       const post = await CommodityPost.findByPk(id);
//       if (!post) {
//         return res.status(responseStatusCode.NOT_FOUND).json({ 
//             status:responseStatus.ERROR,
//             message: "Post not found" });
//       }
//       res.status(responseStatusCode.OK).json({
//         status:responseStatus.SUCCESS,
//         data:post.dataValues
//       });
//     } catch (err) {
//       console.log(err);
//             res.status(responseStatusCode.BAD_REQUEST).json({
//                 status: responseStatus.ERROR,
//                 data:err,
//             });
//     }
//   });

  // Add a new post
  app.post("/api/media/posts", async (req, res) => {
    const data = req.body;

    try {
      const post = await CommodityPost.create({
        ...data,
        createdAt: new Date(),
      });
      res.status(responseStatusCode.CREATED).json({
        status:responseStatus.SUCCESS,
        message:"Successfully added a post",
        data:post.dataValues
      });
    } catch (err) {
       console.log(err);
            res.status(responseStatusCode.BAD_REQUEST).json({
                status: responseStatus.ERROR,
                data:err,
            });
    }
  });


  // Update a post
  app.put("/api/media/posts/", async (req, res) => {

    const { title, text, images, video,id } = req.body;

    try {
      const post = await CommodityPost.findByPk(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      const newPost =  await CommodityPost.update({title,text,images,video},{where:{id:id}})
      res.status(responseStatusCode.ACCEPTED).json({
        status:responseStatus.SUCCESS,
        data:{
            affectedRow:newPost
        }
      });
    } catch (err) {
      console.log(err);
        res.status(responseStatusCode.BAD_REQUEST).json({
            status: responseStatus.ERROR,
            data:err,
        });
    }
  });

  // Delete a post
  app.delete("/api/media/posts/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const post = await CommodityPost.findByPk(id);
      if (!post) {
        return res.status(responseStatusCode.NOT_FOUND).json({ 
            status:responseStatus.ERROR,
            message: "Post not found" });
      }
      await post.destroy();
      res.status(responseStatusCode.ACCEPTED).json(getResponseBody(responseStatus.SUCCESS,"Successfully deleted a post"));
    } catch (err) {
      console.log(err);
      res.status(responseStatusCode.BAD_REQUEST).json(getResponseBody(responseStatus.ERROR,"",err));
    }
  });


  // Get all comments for a specific post
  app.get("/api/media/posts/comments/:postId", async (req, res) => {
    const { postId } = req.params;

    try {
      const comments = await CommodityPostComment.findAll({
        where: { postId },
      });
      res.status(responseStatusCode.OK).json(getResponseBody(responseStatus.SUCCESS,"",comments));
    } catch (err) {
      console.log(err);
      res.status(responseStatusCode.BAD_REQUEST).json(getResponseBody(responseStatus.ERROR,"",err));
    }
  });


  // Add a new comment to a post
  app.post("/api/media/posts/comments/", async (req, res) => {
    const { postId, userId, text } = req.body;

    try {
      const comment = await CommodityPostComment.create({
        postId,
        userId,
        text,
        createdAt: new Date(),
      });
      res.status(responseStatusCode.CREATED).json(getResponseBody(responseStatus.SUCCESS,`Successsfully added a comment to postId = ${postId}`,comment));
    } catch (err) {
      console.log(err);
      res.status(responseStatusCode.BAD_REQUEST).json(getResponseBody(responseStatus.ERROR,"",err));
    }
  });

  // Update a comment
  app.put("/api/media/posts/comments/", async (req, res) => {
    const { text,id} = req.body;
    try {
      const affectedRow = await CommodityPostComment.update({text},{where:{id}});
      if (affectedRow[0] < 1) {
        return res.status(responseStatusCode.UNPROCESSIBLE_ENTITY).json(getResponseBody(responseStatus.UNPROCESSED,"Fail to update"));
      }
      res.status(responseStatusCode.ACCEPTED).json(getResponseBody(responseStatus.SUCCESS,'Update successfully',{affectedRow})); 
    } catch (err) {
      console.log(err);
     res.status(responseStatusCode.BAD_REQUEST).json(getResponseBody(responseStatus.ERROR,"",err));
    }
  });


  // Get all likes for a specific post
  app.get("/api/media/posts/likes/:postId", async (req, res) => {
    const { postId } = req.params;

    try {
      const likes = await CommodityPostLike.findAll({
        where: { postId },
      });
      res.status(responseStatusCode.OK).json(getResponseBody(responseStatus.SUCCESS,"",likes));
    } catch (err) {
      console.log(err);
      res.status(responseStatusCode.BAD_REQUEST).json(getResponseBody(responseStatus.ERROR,"",err));
    }
  });


  // Add a new like to a post
//   app.post("/api/media/posts/likes", async (req, res) => {
//     const { postId, userId } = req.body;

//     try {
//       const like = await CommodityPostLike.create({
//         postId,
//         userId,
//         createdAt: new Date(),
//       });
//        res.status(responseStatusCode.CREATED).json(getResponseBody(responseStatus.SUCCESS,"",like));
//     } catch (err) {
//       console.log(err);
//        res.status(responseStatusCode.BAD_REQUEST).json(getResponseBody(responseStatus.ERROR,"",err));
//     }
//   });


  // Remove and add a like from a post or unlike a post
   app.put("/api/media/posts/likes/", async (req, res) => {
    const { userId, postId } = req.body;
    try {
      const follow = await CommodityPostLike.findOne({
        where: {userId,postId}
      });
      
      if(follow){
        let affectedRow = await CommodityPostLike.destroy({
        where: {userId,postId}
      });
      if (affectedRow < 1) {
         return res.status(responseStatusCode.UNPROCESSIBLE_ENTITY).json(getResponseBody(responseStatus.UNPROCESSED,"Fail to unlike a post"));
      }
        return res.status(responseStatusCode.ACCEPTED).json(getResponseBody(responseStatus.SUCCESS,'unliked a post successfully',{affectedRow})); 
      }
       const newFollow = await CommodityPostLike.create({
        userId,
        postId,
        createdAt: new Date(),
      });
       res.status(responseStatusCode.CREATED).json(getResponseBody(responseStatus.SUCCESS,"Liked a post sucessfully",newFollow));

    } catch (err) {
      console.log(err);
      res.status(responseStatusCode.BAD_REQUEST).json(getResponseBody(responseStatus.ERROR,"",err));
    }
  });

}
