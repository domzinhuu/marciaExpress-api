module.exports = {
    port:'3005',
    jsonLimit:'100kb',
    mongooseUrl:process.env.MONGOLAB_URI ? process.env.MONGOLAB_URI  : 'mongodb://localhost:27017/marciadb',
    secretKey: process.env.SECRET_KEY ? process.env.SECRET_KEY : 'S3c4E7-K3y-L0c4L'
}