const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const posts = {};

const handleEvent = (type, data) => {
    if(type === 'PostCreated') {
        const { id, title } = data;

        posts[id] = { id, title, comments: [] };
    }

    if(type === 'CommentCreated') {
        const { id, content, postId, status } = data;

        const post = posts[postId];
       
        post.comments.push({ id, content, status });
    }

    // 코멘트 상태 업데이트 수신 후 상태 업데이트 진행
    if(type === 'CommentUpdated') {
        const { id, postId, status, content } = data;
        
        const post = posts[postId];
        // console.log('post---', post)
        const comment = post.comments.find(comment => {
            return comment.id === id;
        });

        comment.status = status;
        comment.content = content;
    }
}

app.get('/posts', (req, res) => {
    res.send(posts);
});

app.post('/events', (req, res) => {
    const { type, data } = req.body;
    
    handleEvent(type, data);
    
    res.send({});
});


// 서비스 다운 후 재실행 시 event 받아오기
app.listen(4002, async () => {
    console.log("Listening on 4002");
    try {
      const res = await axios.get("http://event-bus-srv:4005/events");
   
      for (let event of res.data) {
        console.log("Processing event:", event.type);
   
        handleEvent(event.type, event.data);
      }
    } catch (error) {
      console.log(error.message);
    }
  });