const drawingLib = `from js import passDrawShape
from js import getMousePos 
from js import clearTerminal 
class Canvas:
    def __init__(self, width=285, height=244):
        self.width = width 
        self.height = height 

    def draw_line(self, x1, y1, x2, y2, color='black'):
        passDrawShape(['line', x1, y1, x2, y2, color]) 

    def draw_rect(self, x, y, width, height, color='black'):
        passDrawShape(['rect', x, y, width, height, color]) 

    def fill_rect(self, x, y, width, height, color='black'):
        passDrawShape(['rect', x, y, width, height, color, False, True]) 

    def draw_oval(self, x, y, width, height, color='black'):
        passDrawShape(['oval', x, y, width, height, color]) 

    def fill_oval(self, x, y, width, height, color='black'):
        passDrawShape(['oval', x, y, width, height, color, False, True]) 
    
    def draw_circle(self, x, y, radius, color='black'):
        passDrawShape(['oval', x, y, radius, radius, color]) 
    
    def fill_circle(self, x, y, radius, color='black'):
        passDrawShape(['oval', x, y, radius, radius, color, False, True]) 

    def draw_string(self, x, y, text, color='black'):
        passDrawShape(['text', x, y, text, color]) 

    def erase(self):
        passDrawShape(['erase'])

    def getMouseX(self):
        return getMousePos('x') 
    
    def getMouseY(self):
        return getMousePos('y') 

def clear_terminal():
    clearTerminal()
`
