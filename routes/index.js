var express = require('express');
const passport = require('passport');
var router = express.Router();
var userSchema = require('./users');
var localStrategy = require('passport-local');
var pinSchema = require('./pins');
var multer = require('multer');
const axios = require('axios');
var commentSchema = require('./comment')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/upload');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({ storage: storage });


passport.use(new localStrategy(userSchema.authenticate()));

router.get('/pindiv/:id', function (req, res) {
  userSchema.findOne({ username: req.session.passport.user })
    .then(function (lu) {
      pinSchema.findOne({ _id: req.params.id })
        // .populate({
        //   path: 'd',
        //   model: pinSchema,
        //   populate: {
        //      path: 'comment',
        //      model: commentSchema,
        //      select: "cmt developer"
        //   }
        // })
        .populate('developer')
        .populate('cmt')
        // .populate('cmt.user')
        .limit(2)
        .then(function (kuch) {
          console.log(kuch.developer.followers)
          res.render('openpindiv', { kuch, lu, follow: true });
          // res.send(kuch);
        })
    })
})

router.get('/', function (req, res, next) {
  res.render('index');
});

router.get('/reg', function (req, res) {
  res.render('reg');
});

router.get('/account', issLoggedIn, function (req, res) {
  userSchema.findOne({ username: req.session.passport.user })
    .populate('followers')
    .then(function (loguser) {
      // res.send(loguser)
      res.render('useracc', { loguser });
    })
});

// router.get('/getfollow/:id', function(req, res){
//   userSchema.findOne({_id:req.params.id})
//   .populate('followers')
//   .then(function(fu){
//     res.send(fu)
//   })
// })

router.get('/createpin/:id', function (req, res) {
  userSchema.findOne({ _id: req.params.id })
    .then(function (val) {
      res.render('pinscreate', { val });
    });
});

router.post('/createpost', upload.single('pinimage'), function (req, res) {
  userSchema.findOne({ username: req.session.passport.user })
    .then(function (lu) {
      pinSchema.create({
        mainhead: req.body.mainhead,
        title: req.body.title,
        destlink: req.body.destlink,
        pinimage: req.file.filename,
        developer: lu._id
      })
        .then(function (pin) {
          res.redirect('/profile');
        })
    })
})

router.get('/home', function (req, res) {
  res.redirect('/profile');
})

router.get('/profile', issLoggedIn, function (req, res) {
  userSchema.findOne({ username: req.session.passport.user })
    .then(function (founduser) {
      pinSchema.find()
        .then(function (allpins) {
          res.render('profile', { allpins, founduser });
        })
    })
});

router.post('/register', function (req, res) {
  var data = new userSchema({
    name: req.body.name,
    username: req.body.username,
    dob: req.body.dob,
    email: req.body.email
  })
  userSchema.register(data, req.body.password)
    .then(function (lu) {
      passport.authenticate('local')(req, res, function () {
        res.redirect('/profile');
      });
    })
    .catch(function (err) {
      res.send(err);
    });
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/'
}), function (req, res, next) { });

router.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/')
});

function issLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    res.redirect('/');
  }
};

router.post('/comment/:id', function (req, res) {
  userSchema.findOne({ username: req.session.passport.user })
    .then(function (lu) {
      pinSchema.findOne({ _id: req.params.id })
        .then(function (fp) {
          commentSchema.create({
            content: req.body.comment,
            user: lu._id,
          })
            .then(function (createcomment) {
              fp.cmt.push(createcomment._id);
              fp.save()
                .then(function (done) {
                  res.redirect(req.headers.referer)
                  // res.send(done);
                })
            })
        })
    })
});

router.get('/post/follow/:id', async function (req, res) {
  var lu = await userSchema.findOne({ username: req.session.passport.user })
  var post = await pinSchema.findOne({ _id: req.params.id })
  var pindeveloper = await userSchema.findOne({ _id: post.developer._id })
  if (pindeveloper.followers.indexOf(lu._id) === -1) {
    pindeveloper.followers.push(lu._id)
  } else {
    var place = pindeveloper.followers.indexOf(lu._id)
    pindeveloper.followers.splice(place, 1)
  }
  var done = await pindeveloper.save()
  // let flag = done.followers.find(u => u === lu._id)
  res.redirect(req.headers.referer)
});

// router.get('/post/follow/:id', async function (req, res) {
//   var lu = await userSchema.findOne({ username: req.session.passport.user })
//   var post = await pinSchema.findOne({ _id: req.params.id })
//   var pindeveloper = await userSchema.findOne({ _id: post.developer._id })
//   if (pindeveloper.followers.indexOf(lu._id) === -1) {
//     pindeveloper.followers.push(lu._id)
//     var done = await pindeveloper.save()
//     res.json({follow : true})
//     res.redirect(req.headers.referer);

//   } else {
//     var place = pindeveloper.followers.indexOf(lu._id)
//     pindeveloper.followers.splice(place, 1)
//     var done = await pindeveloper.save()
//     res.json({follow : false})
//     res.redirect(req.headers.referer);
//   }
// });

// router.get('/post/unfollow/:id', async function(req, res){
//   var lu = await userSchema.findOne({username : req.session.passport.user})
//   var post =  await pinSchema.findOne({_id:req.params.id})
//   var pindeveloper = await userSchema.findOne({_id : post.developer._id})
//   var place = pindeveloper.followers.indexOf(kuch._id)
//   pindeveloper.followers.splice(place, 1)
//   var done = await pindeveloper.save()
//   // res.send(done);
//   res.json({follow : false})
// })

router.get('/post/save/:id', async function (req, res) {
  var lu = await userSchema.findOne({ username: req.session.passport.user })
  var post = await pinSchema.findOne({ _id: req.params.id })
  if (lu.saves.indexOf(post._id) == -1) {
    lu.saves.push(post._id)
  } else {
    var pos = lu.saves.indexOf(post._id)
    lu.saves.splice(pos, 1);
  }
  var savepins = await lu.save()
  // res.send(savepins);
  res.redirect(req.headers.referer);
});

router.get('/user/saves/:id', function (req, res) {
  userSchema.findOne({ _id: req.params.id })
    .populate('saves')
    .then(function (lu) {
      // res.send(lu)
      res.render('mysave', { lu })
    })
})

module.exports = router;
