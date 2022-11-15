class Canvas:
    def __init__(self, width=285, height=244):
        self.width = width 
        self.height = height
        objects = []

    def move(obj, x_amount, y_amount):
        objects[obj]['coords'][0] += x_amount
        objects[obj]['coords'][1] += y_amount
        objects[obj]['coords'][2] += x_amount
        objects[obj]['coords'][3] += y_amount
        passDrawShape(['move', obj, x_amount, y_amount])
        return objects[obj]['coords']

    def delete(obj):
        objects.pop(obj)
        passDrawShape(['delete', obj])

    def coords(obj, x1=None, y1=None, x2=None, y2=None):
        """
        Sets the new coordinates. If x1, etc. are not given,
        returns the coordinates as a 4-tuple
        """
        if x1 is None:
            # all four must be present
            return objects[obj]['coords']
        objects[obj]['coords'] = [x1, y1, x2, y2]
        passDrawShape(['coords', obj, x1, y1, x2, y2])
        return objects[obj]['coords']

    def create_line(self, x1, y1, x2, y2, color='black'):
        self.objects.append({'obj': 'line', 'coords': [x1, y1, x2, y2], 'color': color, 'fill': ''})
        passDrawShape(['line', x1, y1, x2, y2, color]) 
        return len(self.objects - 1)

    def create_rectangle(self, x1, y1, x2, y2, color='black', fill=''):
        self.objects.append({'obj': 'rectangle', 'coords': [x1, y1, x2, y2], 'color': color, 'fill': fill})
        passDrawShape(['rect', x1, y1, x2, y2, color, fill]) 
        return len(self.objects - 1)

    def create_oval(self, x1, y1, x2, y2, color='black', fill=''):
        self.objects.append({'obj': 'oval', 'coords': [x1, y1, x2, y2], 'color': color, 'fill': fill})
        passDrawShape(['oval', x, y, width, height, color]) 
        return len(self.objects - 1)

    def create_text(self, x, y, text='', color='black', fill=''):
        self.objects.append({'obj': 'text', 'coords': [x1, y1, x2, y2], 'color': color, 'fill': fill})
        passDrawShape(['text', x, y, text, color]) 
        return len(self.objects - 1)

    def erase(self):
        passDrawShape(['erase'])
