import mongoose from "mongoose";

const synopSchema = new mongoose.Schema({
    title: String,
    synopsis: String,
    starcast: String,
    poster: String
});

const Synopsis = mongoose.model('Synopsis', synopSchema);
export default Synopsis;