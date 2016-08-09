
var URL = require('url')

app.post('/api/ogParse', function (req, res) {

  parseRequestPublic(req, res, (fields, file) => {

    if (!fields.url)
      return errRes({message: 'URL missing', displayMessage: 'URL missing'}, res)

    var url = (URL.parse(fields.url).protocol) ? fields.url : ('http://' + fields.url)
    var defaultImage = 'https://d3ke52d0l2d5vx.cloudfront.net/frequent/ogPreview.jpg'
    var metaData = {}
    var ogData = {}
    var resData = {}
    //var imageArray = []

    var options = {
      url: url,
      headers: {
        'User-Agent': ( req.headers['user-agent'] ) ? ( req.headers['user-agent'] ) : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.80 Safari/537.36'
      }
    }

    require('request')(options, function (err, response, body) {

      if (err || response.statusCode != 200 )
        return errorRes('Something went Wrong', res)

      var hostname = response.client['_host'] || URL.parse(fields.url).hostname

      var $ = require('cheerio').load(body)
      var meta = $('meta') || {}
      var keys = Object.keys(meta)

      keys.forEach(function (key) {

        if (meta[key].attribs && meta[key].attribs.property && meta[key].attribs.content) {

          var property = meta[key].attribs.property,
              content = meta[key].attribs.content
          if (content.length !== 0) {

            if (property === 'og:title')
              ogData.title = content

            if (property === 'og:description')
              ogData.description = content.substring(0, 69)


            if (property === 'og:image') {
              if (!ogData.images)
                ogData.images = [content]
              else if (Array.isArray(ogData.images))
                ogData.images.push(content)
            }
          }
        } else if (meta[key].attribs && meta[key].attribs.name && meta[key].attribs.content ) {

          //if og parameters aren't set
          var name = meta[key].attribs.name
          content = meta[key].attribs.content

          if (content.length !== 0) {

            if (name === 'title')
              metaData.title = content

            if (name === 'description')
              metaData.description = content.substring(0, 69)
          }
        }
      })

      resData.url = url
      resData.title = ogData.title || $('title').text() || metaData.title
      resData.description = ogData.description || metaData.description || undefined
      resData.domain = hostname
      resData.images = ogData.images || [defaultImage]

      /*
      $('img').each(function (index) {
        var src = (URL.parse($(this).attr('src')).host) ? ($(this).attr('src')) : (hostname + '/' + $(this).attr('src'))
        console.log('%d : %s', index, src)
        imageArray.push(src)
      })
      */

      return successRes(resData, res)
    })

  })
})