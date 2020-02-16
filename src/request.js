const axios = require("axios");

const MAX_ATTEMPTS = 3;

const executer = config =>
  new Promise(async (resolve, reject) => {
    let current = 0;
    while (current < MAX_ATTEMPTS) {
      console.log(`Get attempt number ${current + 1}`);
      try {
        const { data } = await axios.request(config);
        console.log(`Attempt number ${current + 1} was successfull`);
        resolve(data);
        break;
      } catch (err) {
        console.log(`Attempt number ${current + 1} failed. The reason: ${err}`);
        current += 1;
        if (current == MAX_ATTEMPTS) reject(err);
      }
    }
  });

const parseArray = value => value.split(",").map(element => element.trim());

const searchMovie = async (title, year) => {
  try {
    console.log(`Trying to get data for ${title} from ${year}`);

    const options = {
      url: process.env.OMDb_URL,
      method: "GET",
      params: {
        apikey: process.env.OMDb_API_KEY,
        t: title,
        y: year,
        type: "movie"
      }
    };

    const data = await executer(options);
    console.log("Request getted succesfully.");
    if (data.Response === "True") {
      const parsed = {
        title: data.Title,
        year: data.Year,
        released: data.Released,
        runtime: data.Runtime,
        genre: parseArray(data.Genre),
        directors: parseArray(data.Director),
        writers: parseArray(data.Writer),
        actors: parseArray(data.Actors),
        plot: data.Plot,
        language: data.Language,
        country: data.Country,
        awards: data.Awards,
        poster: data.Poster,
        production: data.Production
      };
      return parsed;
    } else {
      console.log(`Movie ${title} not found: ${data.Error}`);
      return false;
    }
  } catch (error) {
    console.log(`Request failed for the following error: ${error}`);
    throw error;
  }
};

exports.searchMovie = searchMovie;
