module.exports = {
    port:'3005',
    jsonLimit:'100kb',
    mongooseUrl:process.env.MONGOLAB_URI ? process.env.MONGOLAB_URI  : 'mongodb://localhost:27017/marciadb'
}