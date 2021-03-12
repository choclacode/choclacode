const Article = require('../models/Article');
const Chocolate = require('../models/Chocolate');

const home_get = async (req, res) => {
  const articles = [
    await Article.findById('5fb20ffc2aa4d6132d2248ba'),
    await Article.findById('5fb271b0ca65a63f893903a3')
  ];
  const chocs = Chocolate.find();
  res.render('home', {
    title: 'Home', articles,
    chocs: [chocs[9], chocs[6], chocs[3]]
  });
}
const about_get = (req, res) => {
  const about = JSON.stringify(require('../data/about.json'), null, 2);
  res.render('others/about', { title: 'About', about });
}
const dashboard_get = async (req, res) => {
  const { user } = res.locals;
  const articles = await Article.find({ 'author.id': user.id, deleted: false });

  res.render('dashboard', { title: 'Dashboard', articles });
}
const disscuss_get = (req, res) => res.render('others/discuss', {
  title: 'Discuss', socket: true
});

const err403 = (req, res) => res.status(403)
  .render('others/error', {
    title: '403 &laquo; Forbidden',
    status: 403,
    detail: 'Forbidden'
  });
const err404 = (req, res) => res.status(404)
  .render('others/error', {
    title: '404 &laquo; Not Found',
    status: 404,
    detail: 'Not Found'
  });

module.exports = {
  home_get, about_get, dashboard_get, disscuss_get,
  err403, err404
};