Name: worldview
Version: @BUILD_VERSION@
Release: 1.@BUILD_NUMBER@%{?dist}
Summary: Browse full-resolution, near real-time satellite imagery.
License: NASA-1.3
URL: http://earthdata.nasa.gov
Source0: worldview.tar.gz
Source1: httpd.conf
Source2: bitly.json
BuildArch: noarch
Requires: httpd

# Turn off the brp-python-bytecompile script
%global __os_install_post %(echo '%{__os_install_post}' | sed -e 's!/usr/lib[^[:space:]]*/brp-python-bytecompile[[:space:]].*$!!g')

# Set httpd configuration
%global httpdconfdir %{_sysconfdir}/httpd/conf.d

%description
%{summary}

%package debug
Summary:	Non-minified version of Worldview for debugging

%description debug
%{summary}

%prep
%setup -c -T
tar xf %{SOURCE0} --touch
cp %{SOURCE1} .
cp %{SOURCE2} .

%install
rm -rf %{buildroot}

# Install Apache configuration for release
install -m 755 -d %{buildroot}/%{httpdconfdir}
install -m 644 httpd.conf %{buildroot}/%{httpdconfdir}/@WORLDVIEW@.conf
rm httpd.conf

# Install release application
install -m 755 -d %{buildroot}/%{_datadir}/@WORLDVIEW@/web
cp -r @WORLDVIEW@/* %{buildroot}/%{_datadir}/@WORLDVIEW@/web

# Keep the bitly API key outside the web root
cp bitly.json %{buildroot}/%{_datadir}/@WORLDVIEW@

%clean
rm -rf %{buildroot}

%files
%defattr(-,root,root,-)
%{_datadir}/@WORLDVIEW@
%config(noreplace) %{httpdconfdir}/@WORLDVIEW@.conf

%post
if [ $1 -gt 0 ] ; then
   if /bin/systemctl show httpd.service | grep ActiveState=active >/dev/null ; then
      /bin/systemctl reload httpd.service
   fi
fi

%postun
if [ $1 -eq 0 ] ; then
   if /bin/systemctl show httpd.service | grep ActiveState=active >/dev/null ; then
      /bin/systemctl reload httpd.service
   fi
fi
