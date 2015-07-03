---
layout: post
type:   post
title:  "My thoughts on using Jekyll"
date:   2015-07-03 14:13:12
categories:
  - Jekyll
tags:   [Jekyll,gulp]
description:  "My first impressions using Jekyll for a blog."
---
[Jekyll](http://jekyllrb.com/) is a weird dude. To his credit, he's skinny, fast, and very trustworthy. He's got some strange habits, however, and has a thick accent.

Probably like a lot of folks just cutting their teeth in front end development, I've been a [WordPress](http://www.wordpress.org) guy for a few years. I've been fairly happy with that environment. PHP is a pretty easy language to pick up for templating, and it's hard to beat the warm fuzzy feelings that come from the WordPress community. Not to mention the enormous plugin ecosystem.

## So why bother with Jekyll?

Full featured CMS platforms like WordPress and Drupal have traded speed and simplicity for functionality over the years. This isn't entirely a bad thing. WordPress makes it trivial to do things like manage users, process and catalogue images, categorize content, and extend the platform to you're heart's content.

I've come to realize, however, that for my purposes managing a simple site blog and portfolio, all that horsepower might be overkill, and what I really need is a 3-speed bike and some hip sneakers.

## Jekyll is fast. Really fast.

Holy crap is it fast. Jekyll brings us back to the good old days of serving static HTML pages, letting you focus on what really matters; *serving the content.* Depending on how onerous your stylesheets and js packages are, it's possible to load even enormous Jekyll sites in milliseconds. There's no database to query, and content is served preassembled.

Coupled with good hosting, like that available *for free* from [GitHub Pages](https://pages.github.com/), your site can load in as little time as 120 milliseconds, so fast the blink of a page load barely even registers to the human mind.

## So what's the downside?

Jekyll leaves things like structured content up to the developer. That can quickly become a HUGE pain in the ass when working with a large team of folks. It's also not at all user friendly, requiring knowledge of the following not-so-beginner-accessible technologies to use effectively:

  - [Jekyll](http://jekyllrb.com/) (duh)
  - [Liquid](http://liquidmarkup.org/) (the super-annoying, half-baked template language for Jekyll)
  - [Gulp](http://gulpjs.com/)/[Grunt](http://gruntjs.com/) (not required but helpful)
  - [Ruby](https://www.ruby-lang.org/) (if you plan on building plugins)

## A Gulpfile to help get you started

Here is the Gulpfile I'm currently using for building my site. Feel free to [let me know](mailto:tim@timrourke.com) if I'm doing anything dumb with this.

FYI, the most up-to-date version of this Gulpfile, along with the source for the rest of this blog, are available at the GitHub repo here for a closer look:

[https://github.com/timrourke/timrourke.github.io](https://github.com/timrourke/timrourke.github.io)

Begin Gulpfile.js:

{% highlight javascript %}
{% include Gulpfile.js %}
{% endhighlight %}
