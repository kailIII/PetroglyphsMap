from sqlalchemy import *
from sqlalchemy.orm import *
from geoalchemy import *

from petroglyphsmap.model.meta import Base

class Group(Base):
    """Table for the geographical groups - POLYGONS - Lambert93"""
    __tablename__ = 'group'
    group_id = Column(Integer, primary_key=True)
    group_number = Column(Integer, nullable=False)
    zone_id = Column(Integer, ForeignKey('zone.zone_id'))                     # Many-to-one relation
    
    # Relationship between rocks and groups
    group_rocks = relationship('Rock', backref='group')
    
    def __init__(self, zone, group):
        self.group_number = group
        self.zone_id = zone