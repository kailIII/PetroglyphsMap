from sqlalchemy import *
from sqlalchemy.orm import *
from geoalchemy import *

from petroglyphsmap.model.meta import Base

class Rock(Base):
    """Table for the geographical rocks - POINTS - Lambert93"""
    __tablename__ = 'rock'
    rock_id = Column(Integer, primary_key=True)
    rock_number = Column(Unicode(10), nullable=False)
    group_id = Column(Integer, ForeignKey('group.group_id'))                  # Many-to-one relationship
    point_x = Column(Float, nullable=False)
    point_y = Column(Float, nullable=False)
    point_z = Column(Float)
    geo_point = GeometryColumn(Point(2, srid=2154, spatial_index=True))
    year = Column(Integer)
    
    # Relationship between figures and rocks
    rock_figures = relationship('Figure', backref='rock')
    
    def __init__(self, zone, group, rock, x, y, z):
        self.rock = rock
        self.group_id = groupid_from_zg(zone, group)
        self.point_x = x
        self.point_y = y
        self.point_z = z
        wkt = "POINT(" + x + " " + y + ")"
        self.geo_point = WKTSpatialElement(wkt)                               # Geometric object (2D)