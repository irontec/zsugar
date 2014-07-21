#!/bin/bash

PACKAGE_VERSION="0.01"

usage() {
cat <<EOF

  Update zimlet version ${PACKAGE_VERSION}
  Copyright Adrian Gibanel Lopez
  Licensed under the GNU PUBLIC LICENSE 3.0

  Usage: $0 BeforeVersion AfterVersion

  Example: $0 1.3.5 1.4.1

EOF

}


FILES_TO_REPLACE="com_irontec_zsugar.xml com_irontec_zsugar.properties com_irontec_zsugar_*.properties doc/README doc/INSTALL doc/LICENSE"

if (( $# != 2 )); then
    echo -e -n "Expecting two parametres\n"
    usage
    exit 1
fi

for nfile in ${FILES_TO_REPLACE} ; do
  sed -i "s/$1/$2/g" "${nfile}"
done

