const { DateTime } = require('luxon')
const sanitizeHTML = require('sanitize-html')
const pluginRss = require('@11ty/eleventy-plugin-rss')
const pluginSyntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss)
  eleventyConfig.addPlugin(pluginSyntaxHighlight)
  eleventyConfig.setDataDeepMerge(true)

  eleventyConfig.addLayoutAlias('post', 'layouts/post.njk')

  eleventyConfig.addFilter('readableDate', dateObj => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('dd LLL yyyy')
  })

  eleventyConfig.addFilter('dateFromTimestamp', timestamp => {
    return DateTime.fromISO(timestamp, { zone: 'utc' }).toJSDate()
  })

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter('htmlDateString', dateObj => {
    return DateTime.fromJSDate(dateObj).toFormat('yyyy-LL-dd')
  })

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter('head', (array, n) => {
    if (n < 0) {
      return array.slice(n)
    }

    return array.slice(0, n)
  })

  // Webmentions Filter
  eleventyConfig.addFilter('webmentionsForUrl', (webmentions, url) => {
    const allowedTypes = ['mention-of', 'in-reply-to']
    const allowedHTML = {
      allowedTags: ['b', 'i', 'em', 'strong', 'a'],
      allowedAttributes: {
        a: ['href']
      }
    }

    const clean = entry => {
      const { content } = entry
      if (content && content['content-type'] === 'text/html') {
        content.value = sanitizeHTML(content.value, allowedHTML)
      }
      return entry
    }

    return webmentions
      .filter(entry => entry['wm-target'] === url)
      .filter(entry => allowedTypes.includes(entry['wm-property']))
      .filter(entry => !!entry.content)
      .map(clean)
  })

  eleventyConfig.addCollection('tagList', require('./_11ty/getTagList'))

  eleventyConfig.addPassthroughCopy('img')
  eleventyConfig.addPassthroughCopy('css')

  /* Markdown Plugins */
  let markdownIt = require('markdown-it')
  let markdownItAnchor = require('markdown-it-anchor')
  let options = {
    html: true,
    breaks: true,
    linkify: true
  }
  let opts = {
    permalink: true,
    permalinkClass: 'direct-link',
    permalinkSymbol: '#'
  }

  eleventyConfig.setLibrary(
    'md',
    markdownIt(options).use(markdownItAnchor, opts)
  )

  return {
    templateFormats: ['md', 'njk', 'html', 'liquid'],

    // If your site lives in a different subdirectory, change this.
    // Leading or trailing slashes are all normalized away, so don’t worry about it.
    // If you don’t have a subdirectory, use "" or "/" (they do the same thing)
    // This is only used for URLs (it does not affect your file structure)
    pathPrefix: '/',

    markdownTemplateEngine: 'liquid',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    passthroughFileCopy: true,
    dir: {
      input: '.',
      includes: '_includes',
      data: '_data',
      output: '_site'
    }
  }
}
