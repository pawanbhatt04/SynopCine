import Synopsis from '../models/synops.js';

async function createSynops(data){
    try{
        const synop = new Synopsis(data);
        return await synop.save();
    } catch(error){
        throw error;
    }
}

async function getSynopsisByTitle(title){
    let movie = await Synopsis.findById(title);
    return movie;
        
}

async function getAllTitles(){
   const result =  await Synopsis.find();
   return result;
        
}

export {createSynops, getSynopsisByTitle, getAllTitles};