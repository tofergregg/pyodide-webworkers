class Canvas:
    def __init__(self, width=285, height=244):
        self.width = width 
        self.height = height
        self.objects = []

    def move(self, obj, x_amount, y_amount):
        self.objects[obj]['coords'][0] += x_amount
        self.objects[obj]['coords'][1] += y_amount
        self.objects[obj]['coords'][2] += x_amount
        self.objects[obj]['coords'][3] += y_amount
        updateCanvas('move', {'obj': obj, 'x_amount': x_amount, 'y_amount': y_amount})
        return self.objects[obj]['coords']

    def delete(self, obj):
        self.objects[obj][obj] = 'deleted'
        updateCanvas('delete', {'obj': obj})

    def coords(self, obj, x1=None, y1=None, x2=None, y2=None):
        """
        Sets the new coordinates. If x1, etc. are not given,
        returns the coordinates as a 4-tuple
        """
        if x1 is None:
            # all four must be present
            return self.objects[obj]['coords']
        self.objects[obj]['coords'] = [x1, y1, x2, y2]
        updateCanvas('coords', {'obj': obj, 'coords': [x1, y1, x2, y2]})
        return self.objects[obj]['coords']

    def create_line(self, x1, y1, x2, y2, color='black'):
        self.objects.append({'obj': 'line', 'coords': [x1, y1, x2, y2], 'color': color, 'fill': ''})
        updateCanvas('create', self.objects[len(self.objects) - 1])
        return len(self.objects) - 1

    def create_rectangle(self, x1, y1, x2, y2, color='black', fill=''):
        self.objects.append({'obj': 'rectangle', 'coords': [x1, y1, x2, y2], 'color': color, 'fill': fill})
        updateCanvas('create', self.objects[len(self.objects) - 1])
        return len(self.objects) - 1

    def create_oval(self, x1, y1, x2, y2, color='black', fill=''):
        self.objects.append({'obj': 'oval', 'coords': [x1, y1, x2, y2], 'color': color, 'fill': fill})
        updateCanvas('create', self.objects[len(self.objects) - 1])
        return len(self.objects) - 1

    def create_text(self, x, y, text='', color='black', fill=''):
        self.objects.append({'obj': 'text', 'coords': [x, y, x, y], 'text': text, 'color': color, 'fill': fill})
        updateCanvas('create', self.objects[len(self.objects) - 1])
        return len(self.objects) - 1

    # only handle text for now
    def itemconfigure(self, obj, text=''):
        print(obj)
        if self.objects[obj]['obj'] == 'text': 
            self.objects[obj]['text'] = text
            updateCanvas('itemconfigure', {'obj': obj, 'text': text})

    def erase(self):
        updateCanvas(['erase'])

    def clearall(self):
        updateCanvas(['clearall'])
