"""The application's model objects"""
from petroglyphsmap.model.meta import Session, Base


#def init_model(engine):
#    """Call me before using any of the tables or classes in the model"""
#    Session.configure(bind=engine)
    
from sqlalchemy import *
from sqlalchemy.orm import *
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from geoalchemy import *

engine = create_engine('postgresql://postgres:postgres@localhost/postgres', echo=True)
session = sessionmaker(bind=engine)

metadata = MetaData(engine)
Begogeo = declarative_base(metadata=metadata)

## Functions to find ID from Zone, Group, Rock, Figure names
def groupidFromZg(zonenum, groupnum):
    for rock in session.query(Rock).filter(Rock.rock==rocknum).filter(Rock.group_id==Group.id).filter(Group.group==groupnum).filter(Group.zone_id==zonenum)
    return rock.rock_id

def rockidFromZgr(zonenum, groupnum, rocknum):
    for rock in session.query(Rock).filter(Rock.rock==rocknum).filter(Rock.group_id==Group.id).filter(Group.group==groupnum).filter(Group.zone_id==zonenum)
    return rock.rock_id

def figureidFromZgrf(zonenum, groupnum, rocknum, figurename):
    for fig in session.query(Figure).filter(Figure.figure==figurename).filter(Figure.rock_id==Rock.rock_id).filter(Rock.rock==rocknum).filter(Rock.group_id==Group.id).filter(Group.group==groupnum).filter(Group.zone_id==zonenum)
    return fig.figure_id


## Data model Zone - Group - Rock - Figure
class Zone(Begogeo):
    __tablename__ = 'zone'
    zone = Column(Integer, primary_key=True)
    geo_poly = GeometryColumn(Polygon(2))
    geo_centro = GeometryColumn(Point(2))
    
    def __init__(self, zone):
        self.zone = zone

        
class Group(Begogeo):
    __tablename__ = 'group'
    group_id = Column(Integer, primary_key=True)
    group = Column(Integer, nullable=False)
    zone_id = Column(Integer, ForeignKey('zone.zone'))        # Many-to-one relation
    geo_poly = GeometryColumn(Polygon(2))
    geo_centro = GeometryColumn(Point(2))
    
    def __init__(self, zone, group):
        self.group = group
        self.zone_id = zone

        
class Rock(Begogeo):
    __tablename__ = 'rock'
    rock_id = Column(Integer, primary_key=True)
    rock = Column(Unicode(10), nullable=False)
    group_id = Column(Integer, ForeignKey('group.group_id'))  # Many-to-one relation
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    z = Column(Float)
    geo_point = GeometryColumn(Point(2))
    
    # Relationship wetween rocks and groups
    grouprocks = relationship(Group, backref=backref('rock', order_by=rock))
    
    def __init__(self, zone, group, rock, x, y, z):
        self.rock = rock
        self.group_id = groupidFromZg(zone, group)
        self.x = x
        self.y = y
        self.z = z
        self.geo_point = WKTSpatialElement("POINT(" + x + " " + y + ")")    # Geographic object (2D)

        
class Figure(Begogeo):
    __tablename__ = 'figure'
    figure_id = Column(Integer, primary_key=True)
    figure = Column(Unicode(5), nullable=False)
    rock_id = Column(Integer, ForeignKey('rock.rock_id'))     # Many-to-one relation
    identite = Column(Unicode(30), index=True)                # Index to improve the queries
    code2 = Column(Unicode(30), index=True)                   # Index to improve the queries
    
    # Relationship wetween figures and rocks
    rockfigures = relationship(Rock, backref=backref('figure', order_by=figure))
    
    def __init__(self, zone, group, rock, figure, identite, code2):
        self.figure = figure
        self.identite = identite
        self.code2 = code2
        self.rock_id = rockidFromZgr(zone, group, rock)


## Load Geometry fcts
GeometryDDL(Zone.__table__)
GeometryDDL(Group.__table__)
GeometryDDL(Rock.__table__)

metadata.drop_all()   # comment this on first occassion
metadata.create_all()