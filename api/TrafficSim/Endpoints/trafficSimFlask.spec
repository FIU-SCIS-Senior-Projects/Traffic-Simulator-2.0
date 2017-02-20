# -*- mode: python -*-

block_cipher = None


a = Analysis(['trafficSimFlask.py'],
             pathex=['C:\\Projects\\Traffic-Simulator-1.0\\api\\TrafficSim\\Endpoints'],
             binaries=[],
             datas=[],
             hiddenimports=['flask'],
             hookspath=[],
             runtime_hooks=[],
             excludes=['jinja2.asyncsupport', 'jinja2.asyncfilters'],
             win_no_prefer_redirects=False,
             win_private_assemblies=False,
             cipher=block_cipher)
pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)
exe = EXE(pyz,
          a.scripts,
          a.binaries,
          a.zipfiles,
          a.datas,
          name='trafficSimFlask',
          debug=True,
          strip=False,
          upx=True,
          console=True )
