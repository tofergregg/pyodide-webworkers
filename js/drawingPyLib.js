const drawingLib = `from js import passDrawShape

def draw_line(x1, y1, x2, y2, color='black'):
    passDrawShape(['line', x1, y1, x2, y2, color]) 

def draw_rect(x, y, width, height, color='black'):
    passDrawShape(['rect', x, y, width, height, color]) 

def fill_rect(x, y, width, height, color='black'):
    passDrawShape(['rect', x, y, width, height, color, False, True]) 

def draw_oval(x, y, width, height, color='black'):
    passDrawShape(['oval', x, y, width, height, color]) 

def fill_oval(x, y, width, height, color='black'):
    passDrawShape(['oval', x, y, width, height, color, False, True]) 

def draw_string(x, y, text, color='black'):
    passDrawShape(['text', x, y, text, color]) 

def erase_canvas():
    passDrawShape(['erase'])
`
