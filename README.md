## Gridtionary - a sliding wordfind game

Gridtionary is a simple browser game where you try to find words in a four by four grid of letters, but there's a twist: you start with one extra letter on the side. Drag it anywhere, and you can shift a row or column of letters over, giving you new word combinations. But beware! This will lower your score.

I'm making this to help brush up on my Javascript. Feel free to suggest features!

Many thanks to [SCOWL](http://wordlist.aspell.net/) for the 3of6game en_ca wordlist.

### Running

The master branch is now hosted on [my GitHub Page](https://isaachorvath.github.io/gridtionary/). Feel free to play there!

If you'd like to host it on your own computer, clone the respository:  
```
git clone https://github.com/IsaacHorvath/gridtionary.git  
cd gridtionary  
```

And then serve it with:  
```
python -m http.server  
```

Then go to `localhost:8000` in your browser.

If you don't have Python you can use any http server, e.g. for Rust fans:  
```
cargo install microserver  
microserver  
```


### Todo

- [x] Implement word selection  
- [x] Fix letter distribution  
- [x] Come up with scoring method  
- [x] Nice CSS animations  
- [ ] Mobile replacement for drag and drop  

