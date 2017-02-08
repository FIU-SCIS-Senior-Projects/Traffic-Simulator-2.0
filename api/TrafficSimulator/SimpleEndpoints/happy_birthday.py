#filename: happy_birthday.py
"""A basic (single function) API written using hug"""
import hug

@hug.get('/happy_birthday')
def happy_birthday():#name, age:hug.types.number=1):
	"""Says happy birthday to a user"""
	return "Happy {age} Birthday {name}!"#.format(**locals())
	
@hug.post()
def post_here(body):
    """This example shows how to read in post data w/ hug outside of its automatic param parsing"""
    return body