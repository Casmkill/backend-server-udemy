var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var mdAutenticacion = require('../middlewares/autenticacion');
var SEED = require('../config/config').SEED;

var app = express();
var Usuario = require('../models/usuario');


var { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = require('../config/config').GOOGLE_CLIENT_ID;
const GOOGLE_SECRET = require('../config/config').GOOGLE_SECRET;

//=====================================================
// Autenticación de Google
//=====================================================

app.post('/google', (req, res) => {

    var token = req.body.token;


    const oAuth2Client = new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_SECRET
    );

    const tiket = oAuth2Client.verifyIdToken({
        idToken: token
            //audience: GOOGLE_CLIENT_ID
    });

    tiket.then(data => {

        var payload = data.payload;

        Usuario.findOne({ email: payload.email }, (err, usuario) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar usuario - login ',
                    errors: err
                });
            }

            if (usuario) {

                if (!usuario.google) {

                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Debe usar su autenticacion normal - login ',
                    });

                } else {
                    // Crear un token!!!
                    usuario.password = ':)';
                    var token = jwt.sign({ usuario: usuario }, SEED, { expiresIn: 14400 }); // 4 horas

                    return res.status(200).json({
                        ok: true,
                        usuario: usuario,
                        token: token,
                        id: usuario._id
                    });
                }
                // Si el usuario no existe por correo
            } else {

                var usuario = new Usuario();

                usuario.nombre = payload.name;
                usuario.email = payload.email;
                usuario.password = ':)';
                usuario.img = payload.picture;
                usuario.google = true;


                usuario.save((err, usuarioBD) => {

                    if (err) {
                        return res.status(500).json({
                            ok: false,
                            mensaje: 'Error al crear usuario - login ',
                            errors: err
                        });
                    }


                    // Crear un token!!!
                    usuario.password = ':)';
                    var token = jwt.sign({ usuario: usuarioBD }, SEED, { expiresIn: 14400 }); // 4 horas

                    return res.status(200).json({
                        ok: true,
                        usuario: usuarioBD,
                        token: token,
                        id: usuarioBD._id
                    });

                });
            }

        });
    }).catch(err => {
        res.status(400).json({
            ok: false,
            errors: err
        })
    });



});


//=====================================================
// Autenticación normal
//=====================================================

app.post('/', (req, res) => {

    var body = req.body;

    Usuario.findOne({ email: body.email }, (err, usuarioBD) => {


        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario',
                errors: err
            });
        }

        if (!usuarioBD) {
            return res.status(400).json({
                ok: true,
                mensaje: 'Credenciales incorrectas - email',
                errors: err
            });

        }

        if (!bcrypt.compareSync(body.password, usuarioBD.password)) {

            return res.status(400).json({
                ok: true,
                mensaje: 'Credenciales incorrectas - password',
                errors: err
            });
        }

        // Crear un token!!!
        usuarioBD.password = ':)';
        var token = jwt.sign({ usuario: usuarioBD }, SEED, { expiresIn: 14400 }); // 4 horas

        return res.status(200).json({
            ok: true,
            usuario: usuarioBD,
            token: token,
            id: usuarioBD._id
        });

    });





});



module.exports = app;