import re

from .utils import Tweet, normalise_location, return_words_ngrams

tweet_id = re.compile(r'"id":"(\d+)"')
author = re.compile(r'"author_id":"(\d+)"')
date = re.compile(r'"created_at":"(.*?)"')
location = re.compile(r'"full_name":"(.*?)"')
text = re.compile(r'"text":"(.*?)"')
label = re.compile(r'"tags":"(.*?)"')

NONE = ""

def meet_break_condition(curr, ce):
    if curr >= ce:
        return True

def twitter_processor(file, cs, ce, sal_dict):
    with open(file, mode='rb') as f:
        f.seek(cs)

        while True:
            line = f.readline().decode()

            _id = tweet_id.search(line)
            author_id = author.search(line)
            created_at = date.search(line)
            full_name = location.search(line)
            content = text.search(line)
            tags = label.search(line)

            # remove username and hashtags from content
            # also remove any internal links in content
            if content:
                content = re.sub(r'@\w+\s*', '', content.group(1))
                content = re.sub(r'#\w+\s*', '', content)
                content = re.sub(r'https?:\/\/\S+', '', content)
            else:
                continue

            # define the base tweet
            tweet = Tweet(tid=_id.group(1) if _id else NONE,
                          author=author_id.group(1) if author_id else NONE,
                          date=created_at.group(1) if created_at else NONE,
                          content= content,
                          tags=tags.group(1) if tags else NONE)

            # find possible gcc locations
            if full_name:
                normalised_location = normalise_location(full_name.group(1).lower())
                ngram_words = return_words_ngrams(normalised_location.split(" "))

                for possible_location in ngram_words:
                    if sal_dict.get(possible_location):
                        tweet.sal = sal_dict.get(possible_location)
                        break

            if tweet.tags:
                print(tweet)            

            if meet_break_condition(f.tell(), ce):
                break