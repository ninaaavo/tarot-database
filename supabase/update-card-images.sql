with major_cards(name, image_url) as (
  values
    ('The Fool', 'https://steve-p.org/cards/pix/RWSa-T-00.png'),
    ('The Magician', 'https://steve-p.org/cards/pix/RWSa-T-01.png'),
    ('The High Priestess', 'https://steve-p.org/cards/pix/RWSa-T-02.png'),
    ('The Empress', 'https://steve-p.org/cards/pix/RWSa-T-03.png'),
    ('The Emperor', 'https://steve-p.org/cards/pix/RWSa-T-04.png'),
    ('The Hierophant', 'https://steve-p.org/cards/pix/RWSa-T-05.png'),
    ('The Lovers', 'https://steve-p.org/cards/pix/RWSa-T-06.png'),
    ('The Chariot', 'https://steve-p.org/cards/pix/RWSa-T-07.png'),
    ('Strength', 'https://steve-p.org/cards/pix/RWSa-T-08.png'),
    ('The Hermit', 'https://steve-p.org/cards/pix/RWSa-T-09.png'),
    ('Wheel of Fortune', 'https://steve-p.org/cards/pix/RWSa-T-10.png'),
    ('Justice', 'https://steve-p.org/cards/pix/RWSa-T-11.png'),
    ('The Hanged Man', 'https://steve-p.org/cards/pix/RWSa-T-12.png'),
    ('Death', 'https://steve-p.org/cards/pix/RWSa-T-13.png'),
    ('Temperance', 'https://steve-p.org/cards/pix/RWSa-T-14.png'),
    ('The Devil', 'https://steve-p.org/cards/pix/RWSa-T-15.png'),
    ('The Tower', 'https://steve-p.org/cards/pix/RWSa-T-16.png'),
    ('The Star', 'https://steve-p.org/cards/pix/RWSa-T-17.png'),
    ('The Moon', 'https://steve-p.org/cards/pix/RWSa-T-18.png'),
    ('The Sun', 'https://steve-p.org/cards/pix/RWSa-T-19.png'),
    ('Judgement', 'https://steve-p.org/cards/pix/RWSa-T-20.png'),
    ('The World', 'https://steve-p.org/cards/pix/RWSa-T-21.png')
),
suits(suit, code) as (
  values ('Wands', 'W'), ('Cups', 'C'), ('Swords', 'S'), ('Pentacles', 'P')
),
ranks(rank, code) as (
  values
    ('Ace', '0A'),
    ('Two', '02'),
    ('Three', '03'),
    ('Four', '04'),
    ('Five', '05'),
    ('Six', '06'),
    ('Seven', '07'),
    ('Eight', '08'),
    ('Nine', '09'),
    ('Ten', '10'),
    ('Page', 'J1'),
    ('Knight', 'J2'),
    ('Queen', 'QU'),
    ('King', 'KI')
),
minor_cards(name, image_url) as (
  select ranks.rank || ' of ' || suits.suit, 'https://steve-p.org/cards/pix/RWSa-' || suits.code || '-' || ranks.code || '.png'
  from suits
  cross join ranks
),
image_map(name, image_url) as (
  select name, image_url from major_cards
  union all
  select name, image_url from minor_cards
)
update public.cards
set image_url = image_map.image_url
from image_map
where public.cards.name = image_map.name;
