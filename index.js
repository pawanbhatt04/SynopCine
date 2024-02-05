import express from 'express';
import ejs from 'ejs';
import bodyParser from 'body-parser';
import OpenAI from 'openai';
import mongoose from 'mongoose';
import fs from 'fs';
import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';
import { createSynops, getSynopsisByTitle, getAllTitles } from './controllers/synopController.js';

mongoose.connect("mongodb://127.0.0.1:27017/synopsis");
dotenv.config();
const port = 3000;
const app = express();
const OPENAPIKEY = process.env.OPEN_API_KEY;
const openai = new OpenAI({
    apiKey: OPENAPIKEY,
  });

  app.use(bodyParser.urlencoded({extended: true})); 
app.use(express.static("public"));

app.set('view engine', ejs);



app.get('/',(req, res)=>{
    res.render('index.ejs',{});
});

app.get('/history/:title',async (req, res)=>{
  let title = req.params.title;
  console.log(title)
  
  const movie = await getSynopsisByTitle(title);
  console.log(movie);
  res.render('movies.ejs', movie);
});
app.post('/movie', async (req, res)=>{
    console.log(req.body);
    const data = await fetchSynopsis(req.body.Idea);
    console.log(data);
    createSynops(data);
    res.render('index.ejs', data);
});

app.get('/history', async (req, res)=>{
    const result = await getAllTitles();
    console.log(result);
    res.render('history.ejs', {
      titles: result,
    });
});

app.listen(port, function(){
    console.log(`listening on port ${port}`);
});



async function fetchSynopsis(outline) {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages:[{"role": "system", "content": `Generate an engaging, professional and marketable movie synopsis based on an outline. The synopsis should include actors names in brackets after each character. Choose actors that would be ideal for this role.`},
            {"role": "user", "content": "outline: A big-headed daredevil fighter pilot goes back to school only to be sent on a deadly mission."},
            {"role": "assistant", "content": "The Top Gun Naval Fighter Weapons School is where the best of the best train to refine their elite flying skills. When hotshot fighter pilot Maverick (Tom Cruise) is sent to the school, his reckless attitude and cocky demeanor put him at odds with the other pilots, especially the cool and collected Iceman (Val Kilmer). But Maverick isn't only competing to be the top fighter pilot, he's also fighting for the attention of his beautiful flight instructor, Charlotte Blackwood (Kelly McGillis). Maverick gradually earns the respect of his instructors and peers - and also the love of Charlotte, but struggles to balance his personal and professional life. As the pilots prepare for a mission against a foreign enemy, Maverick must confront his own demons and overcome the tragedies rooted deep in his past to become the best fighter pilot and return from the mission triumphant."},
            {"role": "user", "content": `outline: ${outline}`},
    ],
      max_tokens: 500
    })
    const synopsis = response.choices[0].message.content.trim()
    const title = await fetchTitle(synopsis);
    const imgprompt = await fetchImagePromt(title, synopsis);
    const imgurl = await fetchImageUrl(imgprompt);
    const stars = fetchStars(synopsis);
    let result = {
        synopsis: synopsis,
        title: title.replace(/^"(.+?)"$/, '$1'),
        starcast: stars,
    }
    const localpath = await downloadImage(imgurl, 'public/images');
      result['poster'] = localpath.replace('public','');
      return result;
  }

  async function fetchTitle(synopsis) {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {"role":"system", "content": "You are assistant. Generate a catchy movie title for given synopsis"},
        {"role": "user", "content": `synopsis: ${synopsis}`},
      ],
      max_tokens: 25,
      temperature: 0.7
    })
    const title = response.choices[0].message.content.trim()
    return title;
  }

  function fetchStars(synopsis){
    const regex = /\(([^)]+)\)/g; // Global regular expression to match content inside parentheses
  
      const matches = [];
      let match;
  
      while ((match = regex.exec(synopsis)) !== null) {
          matches.push(match[1]); // Extracted content inside brackets
      }
  
      const combinedString = matches.join(', ');
      return combinedString;
  }

  async function fetchImagePromt(title, synopsis){
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {"role": "system", "content": "Give a short description of an image which could be used to advertise a movie based on a title and synopsis. The description should be rich in visual detail but contain no names."},
        {"role": "user", "content": "title: Love's Time Warp, synopsis: When scientist and time traveller Wendy (Emma Watson) is sent back to the 1920s to assassinate a future dictator, she never expected to fall in love with them. As Wendy infiltrates the dictator's inner circle, she soon finds herself torn between her mission and her growing feelings for the leader (Brie Larson). With the help of a mysterious stranger from the future (Josh Brolin), Wendy must decide whether to carry out her mission or follow her heart. But the choices she makes in the 1920s will have far-reaching consequences that reverberate through the ages."},
        {"role": "assistant", "content": "image description: A silhouetted figure stands in the shadows of a 1920s speakeasy, her face turned away from the camera. In the background, two people are dancing in the dim light, one wearing a flapper-style dress and the other wearing a dapper suit. A semi-transparent image of war is super-imposed over the scene."},
        {"role": "user", "content": "title: zero Earth, synopsis: When bodyguard Kob (Daniel Radcliffe) is recruited by the United Nations to save planet Earth from the sinister Simm (John Malkovich), an alien lord with a plan to take over the world, he reluctantly accepts the challenge. With the help of his loyal sidekick, a brave and resourceful hamster named Gizmo (Gaten Matarazzo), Kob embarks on a perilous mission to destroy Simm. Along the way, he discovers a newfound courage and strength as he battles Simm's merciless forces. With the fate of the world in his hands, Kob must find a way to defeat the alien lord and save the planet."},
        {"role": "assistant", "content": "image description: A tired and bloodied bodyguard and hamster standing atop a tall skyscraper, looking out over a vibrant cityscape, with a rainbow in the sky above them."},
        {"role": "user", "content":`title: ${title}, synopsis: ${synopsis}`},
      ],
      temperature: 0.8,
      max_tokens: 100
    })
    return response.choices[0].message.content.trim();
  }

  async function fetchImageUrl(imagePrompt){
    const response = await openai.images.generate({
      model: 'dall-e-2',
      prompt: `${imagePrompt}. There should be no text in this image.`,
      n: 1,
      size: '256x256',
      response_format: 'url',
    },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAPIKEY}`,
        },
    });
    console.log(response);
    const url = response.data[0].url;
    return url;
}


async function downloadImage(url, saveDirectory) {
  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
    });

     // Extract the file extension
    const uniqueFilename = generateUniqueFilename("png");
    const localPath = path.join(saveDirectory, uniqueFilename);

    const writer = fs.createWriteStream(localPath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        resolve(localPath);
      });
      writer.on('error', reject);
    });
  } catch (error) {
    throw error;
  }
}

function generateUniqueFilename(extension = '') {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${randomString}.${extension}`;
}